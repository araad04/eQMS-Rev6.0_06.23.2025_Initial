import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout/page-header";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { BadgeColored } from "@/components/ui/badge-colored";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils";
import { 
  Plus, 
  Search, 
  Users, 
  UserCircle, 
  Eye, 
  Shield
} from "lucide-react";
import { Link } from "wouter";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string | null;
  createdAt: string;
}

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [userRole, setUserRole] = useState<string>("all");
  const [userDepartment, setUserDepartment] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Fetch users
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users", userRole, userDepartment],
    queryFn: async ({ queryKey }) => {
      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
      });
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text || res.statusText}`);
      }
      
      return res.json();
    },
  });
  
  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, we might want to trigger a search API call here
    // or apply the search filter
  };
  
  // Helper function to get role badge variant
  const getRoleBadgeVariant = (role: string): "default" | "yellow" | "blue" | "green" | "red" | "purple" | "orange" => {
    const roleMap: Record<string, "default" | "yellow" | "blue" | "green" | "red" | "purple" | "orange"> = {
      "Admin": "purple",
      "Quality Manager": "blue",
      "Document Control": "yellow",
      "Auditor": "green",
      "Staff": "default"
    };
    return roleMap[role] || "default";
  };
  
  // Filter users based on search query and filters
  const filteredUsers = users?.filter(user => 
    (userRole === "all" || user.role === userRole) &&
    (userDepartment === "all" || user.department === userDepartment) &&
    (
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  ) || [];

  // Pagination calculations
  const totalUsers = filteredUsers.length;
  const totalPages = Math.ceil(totalUsers / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, start + maxVisiblePages - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };
  
  return (
    <>
      <PageHeader 
        title="User Management"
        description="Manage system users and permissions"
        actions={[
          {
            label: "Add User",
            href: "/user-management/create",
            icon: <Plus className="h-5 w-5" />,
          }
        ]}
      />
      
      <div className="px-6 py-8">
        <div className="bg-white shadow rounded-lg">
          {/* Search and filter section */}
          <div className="p-5 border-b border-neutral-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search bar */}
              <form onSubmit={handleSearch} className="w-full md:w-96">
                <div className="relative">
                  <Input
                    type="text" 
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-4 w-4 text-neutral-400" />
                  </div>
                </div>
              </form>
              
              {/* Filters */}
              <div className="flex flex-wrap gap-3">
                <Select value={userRole} onValueChange={setUserRole}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Quality Manager">Quality Manager</SelectItem>
                    <SelectItem value="Document Control">Document Control</SelectItem>
                    <SelectItem value="Auditor">Auditor</SelectItem>
                    <SelectItem value="Staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={userDepartment} onValueChange={setUserDepartment}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by department" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    <SelectItem value="Quality Assurance">Quality Assurance</SelectItem>
                    <SelectItem value="Regulatory Affairs">Regulatory Affairs</SelectItem>
                    <SelectItem value="Engineering">Engineering</SelectItem>
                    <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="R&D">R&D</SelectItem>
                    <SelectItem value="Executive">Executive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Users table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Created On</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  // Loading skeleton
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-neutral-100 rounded animate-pulse"></div>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : currentUsers && currentUsers.length > 0 ? (
                  // Actual user data
                  currentUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <BadgeColored variant={getRoleBadgeVariant(user.role)}>
                          {user.role}
                        </BadgeColored>
                      </TableCell>
                      <TableCell>{user.department || "-"}</TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/user-management/${user.id}`}>
                          <Button variant="ghost" size="sm" className="text-primary">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  // No users found
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center">
                        <Users className="h-12 w-12 text-neutral-300 mb-2" />
                        <h3 className="text-lg font-medium text-neutral-900">No users found</h3>
                        <p className="text-neutral-500 mt-1">
                          {searchQuery || userRole !== "all" || userDepartment !== "all" ? 
                            "Try adjusting your search or filters" : 
                            "Get started by adding your first user"}
                        </p>
                        {!searchQuery && userRole === "all" && userDepartment === "all" && (
                          <Link href="/user-management/create">
                            <Button className="mt-4">
                              <UserCircle className="h-4 w-4 mr-2" />
                              Add User
                            </Button>
                          </Link>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="py-4 border-t border-neutral-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-neutral-500">
                  Showing {startIndex + 1} to {Math.min(endIndex, totalUsers)} of {totalUsers} users
                </div>
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) handlePageChange(currentPage - 1);
                        }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {generatePageNumbers().map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink 
                          href="#" 
                          isActive={page === currentPage}
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(page);
                          }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages) handlePageChange(currentPage + 1);
                        }}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}