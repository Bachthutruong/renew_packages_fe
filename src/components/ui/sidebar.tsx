import React from 'react';
import { cn } from '../../lib/utils';

interface SidebarProps {
  children: React.ReactNode;
  className?: string;
}

interface SidebarContentProps {
  children: React.ReactNode;
  className?: string;
}

interface SidebarHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface SidebarMenuProps {
  children: React.ReactNode;
  className?: string;
}

interface SidebarMenuItemProps {
  children: React.ReactNode;
  className?: string;
  active?: boolean;
  onClick?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ children, className }) => {
  return (
    <div className={cn("flex h-full w-64 flex-col bg-card border-r", className)}>
      {children}
    </div>
  );
};

export const SidebarContent: React.FC<SidebarContentProps> = ({ children, className }) => {
  return (
    <div className={cn("flex-1 overflow-y-auto p-4", className)}>
      {children}
    </div>
  );
};

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ children, className }) => {
  return (
    <div className={cn("border-b p-4", className)}>
      {children}
    </div>
  );
};

export const SidebarMenu: React.FC<SidebarMenuProps> = ({ children, className }) => {
  return (
    <div className={cn("space-y-2", className)}>
      {children}
    </div>
  );
};

export const SidebarMenuItem: React.FC<SidebarMenuItemProps> = ({ 
  children, 
  className, 
  active = false, 
  onClick 
}) => {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium cursor-pointer transition-colors",
        active 
          ? "bg-primary text-primary-foreground" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}; 