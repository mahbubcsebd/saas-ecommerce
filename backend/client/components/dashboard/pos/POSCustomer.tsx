"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { useConfirm } from "@/hooks/use-confirm";
import { cn } from "@/lib/utils";
import { UserService } from "@/services/user.service";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface POSCustomerProps {
  selectedUser: any;
  setSelectedUser: (user: any) => void;
  walkInName: string;
  setWalkInName: (name: string) => void;
  walkInPhone: string;
  setWalkInPhone: (phone: string) => void;
}

export function POSCustomer({
  selectedUser,
  setSelectedUser,
  walkInName,
  setWalkInName,
  walkInPhone,
  setWalkInPhone
}: POSCustomerProps) {
  const { alert } = useConfirm();
  const { data: session } = useSession();
  const [isWalkIn, setIsWalkIn] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
      firstName: "",
      lastName: "",
      email: "",
      phone: ""
  });
  const [isCreating, setIsCreating] = useState(false);

  // Initial load
  useEffect(() => {
    if ((session as any)?.accessToken) {
        searchUsers("");
    }
  }, [(session as any)?.accessToken]);

  // Debounced Search
  useEffect(() => {
    if (query.length === 0) return; // Handled by initial load or when cleared
    const timer = setTimeout(() => {
        if (query.length >= 2) {
            searchUsers(query);
        }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const searchUsers = async (term: string) => {
    setLoading(true);
    try {
        const data = await UserService.searchUsers((session as any)?.accessToken as string, term);
        if (data.success) {
            setUsers(data.data);
        }
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const handleSelectUser = (user: any) => {
    setSelectedUser(user);
    setIsWalkIn(false);
    setOpen(false);
    setQuery("");
  };

  const handleCreateCustomer = async () => {
      if (!newCustomer.firstName || !newCustomer.lastName || !newCustomer.email) {
          await alert({
              title: "Input Required",
              message: "Customer name and email address are mandatory for registration.",
              type: "warning"
          });
          return;
      }
      setIsCreating(true);
      try {
          const data = await UserService.createUser((session as any)?.accessToken as string, {
              ...newCustomer,
              role: 'CUSTOMER'
          });
          if (data.success) {
              handleSelectUser(data.data);
              setIsNewDialogOpen(false);
              setNewCustomer({ firstName: "", lastName: "", email: "", phone: "" });
              toast.success("Customer created successfully");
          } else {
              toast.error(data.message || "Failed to create customer");
          }
      } catch (error) {
          console.error(error);
          toast.error("Error creating customer");
      } finally {
          setIsCreating(false);
      }
  };

  return (
    <Card className="bg-white shadow-sm border-0">
        <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="walkIn"
                        checked={isWalkIn}
                        onCheckedChange={(c) => {
                            setIsWalkIn(c === true);
                            if(c) setSelectedUser(null);
                        }}
                    />
                    <Label htmlFor="walkIn" className="cursor-pointer font-medium">Walk-in Customer</Label>
                </div>
                {!isWalkIn && (
                     <Button variant="outline" size="sm" onClick={() => setIsNewDialogOpen(true)}>
                        <Plus className="h-3 w-3 mr-1" /> New
                     </Button>
                )}
            </div>

            {isWalkIn ? (
                <div className="grid grid-cols-1 gap-3">
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Name</Label>
                        <Input
                            value={walkInName}
                            onChange={(e) => setWalkInName(e.target.value)}
                            placeholder="Guest Name"
                            className="bg-muted/30 focus-visible:bg-white transition-colors"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Phone</Label>
                        <Input
                            value={walkInPhone}
                            onChange={(e) => setWalkInPhone(e.target.value)}
                            placeholder="017xxxxxxxx"
                            className="bg-muted/30 focus-visible:bg-white transition-colors"
                        />
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                     <Label className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Customer Search</Label>
                     <Popover open={open} onOpenChange={setOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={open}
                          className="w-full justify-between h-11 bg-muted/30 hover:bg-white"
                        >
                          {selectedUser
                            ? `${selectedUser.firstName} ${selectedUser.lastName}`
                            : "Search name, phone or email..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[350px] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput
                             placeholder="Type to search..."
                             value={query}
                             onValueChange={setQuery}
                          />
                          <CommandList>
                            <CommandEmpty>No customer found.</CommandEmpty>
                            <CommandGroup heading="Results">
                              {users.map((user) => (
                                <CommandItem
                                  key={user.id}
                                  value={`${user.firstName} ${user.lastName} ${user.phone} ${user.email}`}
                                  onSelect={() => handleSelectUser(user)}
                                  className="cursor-pointer py-2"
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedUser?.id === user.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                      <span className="font-medium">{user.firstName} {user.lastName}</span>
                                      <span className="text-xs text-muted-foreground">{user.phone} • {user.email}</span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>

                     {selectedUser && (
                         <div className="flex items-center gap-3 mt-3 p-3 bg-primary/5 rounded-md border border-primary/10">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                {selectedUser.firstName?.[0]}
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-sm">{selectedUser.firstName} {selectedUser.lastName}</p>
                                <p className="text-xs text-muted-foreground">{selectedUser.phone}</p>
                                <p className="text-xs text-muted-foreground">{selectedUser.email}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => setSelectedUser(null)}>
                                <span className="sr-only">Remove</span>
                                <Plus className="h-4 w-4 rotate-45" />
                            </Button>
                         </div>
                     )}
                </div>
            )}
        </CardContent>

        {/* New Customer Dialog */}
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Customer</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                                id="firstName"
                                value={newCustomer.firstName}
                                onChange={(e) => setNewCustomer({...newCustomer, firstName: e.target.value})}
                                placeholder="John"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                                id="lastName"
                                value={newCustomer.lastName}
                                onChange={(e) => setNewCustomer({...newCustomer, lastName: e.target.value})}
                                placeholder="Doe"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="newEmail">Email</Label>
                        <Input
                            id="newEmail"
                            type="email"
                            value={newCustomer.email}
                            onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                            placeholder="john@example.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="newPhone">Phone</Label>
                        <Input
                            id="newPhone"
                            value={newCustomer.phone}
                            onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                            placeholder="017xxxxxxxx"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsNewDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreateCustomer} disabled={isCreating}>
                        {isCreating ? "Creating..." : "Create Customer"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </Card>
  );
}
