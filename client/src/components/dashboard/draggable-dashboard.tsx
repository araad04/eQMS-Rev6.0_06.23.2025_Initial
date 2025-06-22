import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, Settings, Eye, EyeOff } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface DashboardWidget {
  id: string;
  type: string;
  title: string;
  component: React.ComponentType<any>;
  props?: any;
  visible: boolean;
  position: number;
}

interface DashboardLayoutConfig {
  id?: number;
  userId: number;
  layout: {
    widgets: DashboardWidget[];
    refreshRate: number;
  };
  isDefault: boolean;
}

interface DraggableDashboardProps {
  widgets: DashboardWidget[];
  onLayoutChange?: (widgets: DashboardWidget[]) => void;
}

export function DraggableDashboard({ widgets: initialWidgets, onLayoutChange }: DraggableDashboardProps) {
  const [widgets, setWidgets] = useState<DashboardWidget[]>(initialWidgets);
  const [editMode, setEditMode] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Load user's dashboard configuration
  const { data: dashboardConfig } = useQuery<DashboardLayoutConfig>({
    queryKey: ['/api/dashboard/layout'],
    retry: 1,
  });

  // Save dashboard layout mutation
  const saveLayoutMutation = useMutation({
    mutationFn: async (layout: DashboardLayoutConfig) => {
      const response = await fetch('/api/dashboard/layout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Local': 'true',
        },
        body: JSON.stringify(layout),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save dashboard layout');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Dashboard Layout Saved",
        description: "Your widget arrangement has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/layout'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save dashboard layout. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Auto-save functionality with debounce
  useEffect(() => {
    if (dashboardConfig && widgets.length > 0) {
      const timeoutId = setTimeout(() => {
        const updatedConfig: DashboardLayoutConfig = {
          ...dashboardConfig,
          layout: {
            widgets: widgets,
            refreshRate: dashboardConfig.layout?.refreshRate || 300000,
          },
        };
        
        saveLayoutMutation.mutate(updatedConfig);
      }, 2000); // 2-second debounce

      return () => clearTimeout(timeoutId);
    }
  }, [widgets, dashboardConfig]);

  // Initialize widgets from saved configuration
  useEffect(() => {
    if (dashboardConfig?.layout?.widgets) {
      const savedWidgets = dashboardConfig.layout.widgets.map((saved, index) => {
        const originalWidget = initialWidgets.find(w => w.id === saved.id);
        return originalWidget ? {
          ...originalWidget,
          visible: saved.visible,
          position: saved.position || index,
        } : saved;
      });
      
      // Sort by position
      savedWidgets.sort((a, b) => a.position - b.position);
      setWidgets(savedWidgets);
    }
  }, [dashboardConfig, initialWidgets]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update positions
    const updatedItems = items.map((item, index) => ({
      ...item,
      position: index,
    }));

    setWidgets(updatedItems);
    onLayoutChange?.(updatedItems);
  };

  const toggleWidgetVisibility = (widgetId: string) => {
    const updatedWidgets = widgets.map(widget =>
      widget.id === widgetId
        ? { ...widget, visible: !widget.visible }
        : widget
    );
    setWidgets(updatedWidgets);
    onLayoutChange?.(updatedWidgets);
  };

  const visibleWidgets = widgets.filter(widget => widget.visible);

  return (
    <div className="space-y-4">
      {/* Dashboard Controls */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Dashboard Widgets</h2>
        <div className="flex gap-2">
          <Button
            variant={editMode ? "default" : "outline"}
            size="sm"
            onClick={() => setEditMode(!editMode)}
          >
            <Settings className="h-4 w-4 mr-2" />
            {editMode ? "Exit Edit Mode" : "Edit Layout"}
          </Button>
        </div>
      </div>

      {/* Widget Visibility Controls (Edit Mode) */}
      {editMode && (
        <Card className="p-4">
          <CardTitle className="text-sm mb-3">Widget Visibility</CardTitle>
          <div className="flex flex-wrap gap-2">
            {widgets.map(widget => (
              <Button
                key={widget.id}
                variant={widget.visible ? "default" : "outline"}
                size="sm"
                onClick={() => toggleWidgetVisibility(widget.id)}
              >
                {widget.visible ? (
                  <Eye className="h-3 w-3 mr-1" />
                ) : (
                  <EyeOff className="h-3 w-3 mr-1" />
                )}
                {widget.title}
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Draggable Widget Grid */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="dashboard-widgets">
          {(provided, snapshot) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className={`grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 transition-colors ${
                snapshot.isDraggingOver ? "bg-muted/20 rounded-lg p-2" : ""
              }`}
            >
              {visibleWidgets.map((widget, index) => (
                <Draggable
                  key={widget.id}
                  draggableId={widget.id}
                  index={index}
                  isDragDisabled={!editMode}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`transition-transform ${
                        snapshot.isDragging ? "rotate-2 scale-105" : ""
                      }`}
                    >
                      <Card className={`relative ${editMode ? "ring-2 ring-primary/20" : ""}`}>
                        {editMode && (
                          <div
                            {...provided.dragHandleProps}
                            className="absolute top-2 right-2 z-10 p-1 bg-background rounded cursor-grab hover:bg-muted"
                          >
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        
                        <CardHeader className={editMode ? "pr-12" : ""}>
                          <CardTitle className="text-base">{widget.title}</CardTitle>
                        </CardHeader>
                        
                        <CardContent>
                          <widget.component {...widget.props} />
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Save Status Indicator */}
      {saveLayoutMutation.isPending && (
        <div className="fixed bottom-4 right-4 bg-primary text-primary-foreground px-4 py-2 rounded-md shadow-lg">
          Saving layout...
        </div>
      )}
    </div>
  );
}