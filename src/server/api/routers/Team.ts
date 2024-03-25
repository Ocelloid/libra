import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { type User } from "./User";

export interface Team {
  id: string;
  title: string;
  description: string;
  dateCreated: Date;
  creatorId: string;
  memberships?: Membership[];
}

export interface Membership {
  id: string;
  memberId: string;
  teamId: string;
  status: "invited" | "declined" | "accepted";
  dateCreated: Date;
  user?: User;
  team?: Team;
}

export const TeamRouter = createTRPCRouter({
  getAllTeams: protectedProcedure.query(async ({ ctx }) => {
    const { db, session } = ctx;
    const data = await db.team.findMany({
      where: {
        memberships: {
          some: {
            memberId: session.user.id,
            status: { in: ["invited", "accepted"] },
          },
        },
      },
      orderBy: {
        dateCreated: "desc",
      },
    });

    return data;
  }),

  deleteTeam: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;
      const { teamId } = input;

      await db.team.delete({
        where: {
          id: teamId,
          creatorId: session.user.id,
        },
      });
    }),

  getTeamById: protectedProcedure
    .input(z.object({ teamId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { db, session } = ctx;
      const { teamId } = input;
      const data = await db.team.findUnique({
        where: {
          creatorId: session.user.id,
          id: teamId,
        },
        include: {
          memberships: {
            include: {
              user: true,
            },
          },
        },
      });

      return data;
    }),

  createTeam: protectedProcedure
    .input(
      z.object({
        title: z.string(),
        description: z.string(),
        userEmails: z.string().array(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;
      const { title, description, userEmails } = input;

      const newTeam = await db.team.create({
        data: {
          creatorId: session.user.id,
          title: title,
          description: description,
          memberships: {
            create: [
              {
                memberId: session.user.id,
                status: "accepted",
              },
            ],
          },
        },
        select: { id: true },
      });

      if (userEmails.length > 1) {
        userEmails.shift();
        const users = await db.user.findMany({
          where: {
            email: { in: userEmails },
          },
        });
        await db.membership.createMany({
          data: users.map((user) => ({
            memberId: user.id,
            teamId: newTeam.id,
            status: "invited",
          })),
          skipDuplicates: true,
        });
      }

      return newTeam;
    }),

  changeOwner: protectedProcedure
    .input(z.object({ teamId: z.string(), memberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;
      const { teamId, memberId } = input;

      const newTeam = await db.team.update({
        where: {
          id: teamId,
          creatorId: session.user.id,
        },
        data: {
          creatorId: memberId,
        },
      });

      return newTeam;
    }),

  updateTeam: protectedProcedure
    .input(
      z.object({
        teamId: z.string(),
        title: z.string(),
        description: z.string(),
        userEmails: z.string().array(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;
      const { teamId, title, description, userEmails } = input;

      const newTeam = await db.team.update({
        where: {
          id: teamId,
          creatorId: session.user.id,
        },
        data: {
          title: title,
          description: description,
        },
        include: {
          memberships: {
            include: { user: true },
          },
        },
      });

      const oldUserEmails = newTeam?.memberships.map(
        (member) => member.user.email ?? "",
      );

      const removedMembers = oldUserEmails.filter(
        (email) => !userEmails.includes(email),
      );
      if (removedMembers.length > 0) {
        const users = await db.user.findMany({
          where: {
            email: { in: removedMembers },
          },
        });
        await db.membership.deleteMany({
          where: {
            memberId: { in: users.map((user) => user.id) },
            teamId: teamId,
          },
        });
      }

      const addedMembers = userEmails.filter(
        (email) => !oldUserEmails.includes(email),
      );
      if (addedMembers.length > 0) {
        const receivers = await db.user.findMany({
          where: {
            email: { in: addedMembers },
          },
          select: { id: true },
        });

        const checkInvitations = await db.membership.findMany({
          where: {
            memberId: { in: receivers.map((receiver) => receiver.id) },
            teamId: teamId,
          },
          select: {
            id: true,
            status: true,
            user: true,
          },
        });

        // changing memberships status
        await db.membership.updateMany({
          where: {
            id: { in: checkInvitations.map((invitation) => invitation.id) },
          },
          data: {
            memberId: session.user.id,
            status: "invited",
          },
        });

        const checkUsers = checkInvitations.map(
          (invitation) => invitation.user.email ?? "",
        );
        const newInvitations = addedMembers.filter(
          (email) => !checkUsers.includes(email),
        );

        const newReceivers = await db.user.findMany({
          where: {
            email: { in: newInvitations },
          },
          select: { id: true },
        });

        const newMemberships = newReceivers.map((receiver) => {
          return {
            memberId: receiver.id,
            teamId: teamId,
            status: "invited",
          };
        });

        // creating new memberships
        await db.membership.createMany({
          data: newMemberships,
        });
      }

      return newTeam;
    }),

  cancelMembership: protectedProcedure
    .input(z.object({ memberId: z.string(), teamId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const { memberId, teamId } = input;

      await db.membership.deleteMany({
        where: {
          memberId: memberId,
          teamId: teamId,
        },
      });
    }),

  respondToInvitation: protectedProcedure
    .input(z.object({ membershipId: z.string(), status: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db } = ctx;
      const { membershipId, status } = input;

      const newMembership = await db.membership.update({
        where: {
          id: membershipId,
        },
        data: {
          status: status,
        },
      });

      return newMembership;
    }),

  sendInvitation: protectedProcedure
    .input(z.object({ receiverEmail: z.string(), teamId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { db, session } = ctx;
      const { receiverEmail, teamId } = input;

      const receiver = await db.user.findFirst({
        where: {
          email: receiverEmail,
        },
        select: { id: true },
      });

      if (receiver) {
        const checkInvitation = await db.membership.findFirst({
          where: {
            memberId: receiver.id,
            teamId: teamId,
          },
          select: {
            id: true,
            status: true,
          },
        });

        if (checkInvitation) {
          // changing membership status
          const newInvitation = await db.membership.update({
            where: {
              id: checkInvitation.id,
            },
            data: {
              memberId: session.user.id,
              status: "invited",
            },
            select: { id: true },
          });

          return newInvitation;
        } else {
          // creating new membership
          const newInvitation = await db.membership.create({
            data: {
              memberId: receiver.id,
              teamId: teamId,
              status: "invited",
            },
            select: { id: true },
          });

          return newInvitation;
        }
      } else return "404"; // user not found
    }),

  getAllInvitations: protectedProcedure.query(async ({ ctx }) => {
    const { db, session } = ctx;
    const data = await db.membership.findMany({
      where: {
        memberId: session.user.id,
        status: "invited",
      },
      orderBy: {
        dateCreated: "desc",
      },
      include: {
        team: true,
      },
    });

    return data;
  }),

  countAllInvitations: protectedProcedure.query(async ({ ctx }) => {
    const { db, session } = ctx;
    const count = await db.membership.aggregate({
      _count: {
        id: true,
      },
      where: {
        memberId: session.user.id,
        status: "invited",
      },
    });

    return count._count.id;
  }),
});
