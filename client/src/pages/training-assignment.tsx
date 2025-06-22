import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { apiRequest, queryClient } from '@/lib/queryClient';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const formSchema = z.object({
  moduleId: z.string().min(1, 'Please select a training module'),
  userIds: z.array(z.number()).min(1, 'Please select at least one user'),
  dueDate: z.date().optional(),
  comments: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function TrainingAssignmentPage() {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined);
  const [selectedUsers, setSelectedUsers] = React.useState<number[]>([]);
  const [, setLocation] = useLocation();

  // Define types
  type TrainingModule = {
    id: number;
    title: string;
    description: string;
    moduleId: string;
    typeId: number;
    version: string;
  };
  
  type User = {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    department?: string;
  };

  // Fetch training modules
  const { data: trainingModules = [], isLoading: isLoadingModules } = useQuery<TrainingModule[]>({
    queryKey: ['/api/training/modules'],
  });

  // Fetch users
  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      moduleId: '',
      userIds: [],
      comments: '',
    },
  });

  const assignTrainingMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const res = await apiRequest('POST', '/api/training/assign', data);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to assign training');
      }
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Training has been assigned successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/training/records'] });
      setLocation('/training-records');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleUserSelection = (userId: number, checked: boolean) => {
    if (checked) {
      setSelectedUsers([...selectedUsers, userId]);
      form.setValue('userIds', [...selectedUsers, userId]);
    } else {
      const filtered = selectedUsers.filter(id => id !== userId);
      setSelectedUsers(filtered);
      form.setValue('userIds', filtered);
    }
  };

  const onSubmit = (data: FormValues) => {
    assignTrainingMutation.mutate(data);
  };

  if (isLoadingModules || isLoadingUsers) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Assign Training</h1>
        <p className="text-muted-foreground">Assign training modules to users</p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Training Assignment</CardTitle>
          <CardDescription>Select a training module and assign it to one or more users</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="moduleId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Training Module</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a training module" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {trainingModules?.map((module: any) => (
                          <SelectItem key={module.id} value={module.id.toString()}>
                            {module.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="userIds"
                render={() => (
                  <FormItem>
                    <FormLabel>Assign To</FormLabel>
                    <div className="border rounded-md p-4 space-y-2 max-h-60 overflow-y-auto">
                      {users?.map((user: any) => (
                        <div key={user.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`user-${user.id}`}
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={(checked) => handleUserSelection(user.id, checked === true)}
                          />
                          <label
                            htmlFor={`user-${user.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {user.firstName} {user.lastName} ({user.username})
                          </label>
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Due Date (Optional)</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(date) => {
                            setSelectedDate(date);
                            field.onChange(date);
                          }}
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="comments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Comments (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Add any comments about this training assignment" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setLocation('/training-records')}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={assignTrainingMutation.isPending}>
                  {assignTrainingMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Assigning...
                    </>
                  ) : (
                    'Assign Training'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}