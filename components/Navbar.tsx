'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { FileText, Briefcase, LayoutDashboard, LogOut } from 'lucide-react';

export function Navbar() {
  const { user, signInWithGoogle, logout } = useAuth();
  const router = useRouter();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
                <FileText className="h-5 w-5" />
              </div>
              <span className="font-bold text-xl tracking-tight">AI Resume Match</span>
            </Link>
            
            {user && (
              <div className="hidden md:flex ml-10 space-x-8">
                <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link href="/jobs" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  Find Jobs
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {!user ? (
              <Button onClick={signInWithGoogle}>Sign In</Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger className="relative h-8 w-8 rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                    <AvatarFallback>{user.displayName?.charAt(0) || 'U'}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.displayName}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/dashboard')} className="cursor-pointer flex items-center">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/jobs')} className="cursor-pointer flex items-center">
                    <Briefcase className="mr-2 h-4 w-4" />
                    <span>Jobs</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
