import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface TabContext {
    isActive: boolean;
    id: string;
}

export type TabLabel = string | ((context: TabContext) => ReactNode);

export interface Tab {
    id: string;
    label: TabLabel;
}

interface CTabsProps {
    tabs: Tab[];
    activeTabId: string;
    onTabChange: (tabId: string) => void;
    onAddTab?: () => void;
    showAddButton?: boolean;
    className?: string;
    children?: ReactNode;
}

export const CTabs: React.FC<CTabsProps> = ({
    tabs,
    activeTabId,
    onTabChange,
    className,
    children
}) => {
    const renderTabLabel = (tab: Tab, isActive: boolean) => {
        if (typeof tab.label === 'string') {
            return tab.label;
        }
        return tab.label({ isActive, id: tab.id });
    };

    return (
        <div className={cn("flex items-center gap-1 border-b border-gray-200", className)}>
            <div className="flex items-center">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={cn(
                            "px-3 py-2 min-w-[50px] text-sm transition-colors border-t border-x rounded-t-md",
                            activeTabId === tab.id
                                ? "bg-white text-gray-900 border-gray-200 relative after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-[1px] after:bg-white cursor-default"
                                : "text-gray-600 hover:bg-gray-100 border-transparent rounded-t-md cursor-pointer"
                        )}
                        onClick={() => onTabChange(tab.id)}
                    >
                        {renderTabLabel(tab, activeTabId === tab.id)}
                    </button>
                ))}
            </div>
            {children}
        </div>
    );
};
