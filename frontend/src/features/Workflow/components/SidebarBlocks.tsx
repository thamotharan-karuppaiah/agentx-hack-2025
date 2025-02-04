import { BlockCategories } from './BlockCategories';

export const SidebarBlocks = () => {
  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-10">
      <div className="flex w-fit flex-col rounded-lg border border-gray-100 bg-white p-1 font-normal text-black shadow-md">
        <BlockCategories variant="sidebar" />
      </div>
    </div>
  );
}; 