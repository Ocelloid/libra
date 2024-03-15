import {PencilIcon} from "@heroicons/react/24/solid";

const NoTasks = () => (
    <div className="mx-auto flex w-3/4 flex-row items-center justify-center gap-8 rounded-sm bg-slate-800 bg-opacity-30 p-10 font-montserrat text-lg md:w-1/2 text-neutral-50">
        <PencilIcon width={40}/>
        <p>Твой список пуст</p>
    </div>
);

export default NoTasks;