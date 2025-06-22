import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Edit, Save } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AssessmentSuggestionsProps {
  assessmentId: number;
  initialSuggestions?: string;
  isEditable?: boolean;
  onSuggestionsUpdated?: (suggestions: string) => void;
}

export function AssessmentSuggestions({
  assessmentId,
  initialSuggestions = "",
  isEditable = true,
  onSuggestionsUpdated
}: AssessmentSuggestionsProps) {
  const [suggestions, setSuggestions] = useState(initialSuggestions);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setSuggestions(initialSuggestions);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!assessmentId) return;

    setIsSaving(true);
    try {
      // Send a PATCH request to update the suggestions
      const response = await apiRequest(
        "PATCH", 
        `/api/supplier-assessments/${assessmentId}`,
        { suggestions }
      );

      if (response.ok) {
        toast({
          title: "Suggestions Updated",
          description: "The assessment suggestions have been saved successfully.",
          variant: "default",
        });
        setIsEditing(false);
        if (onSuggestionsUpdated) {
          onSuggestionsUpdated(suggestions);
        }
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to update suggestions");
      }
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "An error occurred while saving suggestions",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center">
          <CheckCircle className="h-5 w-5 mr-2 text-primary" />
          Improvement Suggestions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <Textarea
            value={suggestions}
            onChange={(e) => setSuggestions(e.target.value)}
            placeholder="Enter suggestions for improvement based on assessment findings..."
            className="min-h-[150px] resize-none"
          />
        ) : (
          <div className="prose prose-sm max-w-none">
            {suggestions ? (
              <p className="text-sm whitespace-pre-line">{suggestions}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 text-muted-foreground" />
                No suggestions provided yet. Click edit to add improvement suggestions.
              </p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        {isEditing ? (
          <>
            <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <span className="mr-2">Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Suggestions
                </>
              )}
            </Button>
          </>
        ) : (
          isEditable && (
            <Button variant="outline" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Suggestions
            </Button>
          )
        )}
      </CardFooter>
    </Card>
  );
}