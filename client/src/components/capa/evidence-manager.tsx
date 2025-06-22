import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { FileText, Upload, X, Check, AlertTriangle, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface EvidenceManagerProps {
  capaId: number;
  phaseType: string;
  onEvidenceUpdate: () => void;
}

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  uploadDate: Date;
  url?: string;
}

export const EvidenceManager: React.FC<EvidenceManagerProps> = ({
  capaId,
  phaseType,
  onEvidenceUpdate
}) => {
  const [evidenceText, setEvidenceText] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [noEvidenceChecked, setNoEvidenceChecked] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('capaId', capaId.toString());
      formData.append('phaseType', phaseType);
      
      return apiRequest(`/api/capas/${capaId}/evidence/upload`, {
        method: 'POST',
        body: formData
      });
    },
    onSuccess: (data, file) => {
      const newFile: UploadedFile = {
        name: file.name,
        size: file.size,
        type: file.type,
        uploadDate: new Date(),
        url: data.url
      };
      setUploadedFiles(prev => [...prev, newFile]);
      toast({
        title: "File Uploaded Successfully",
        description: `${file.name} has been attached to this CAPA phase`
      });
      onEvidenceUpdate();
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file",
        variant: "destructive"
      });
    }
  });

  const handleFileSelect = (file: File) => {
    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 10MB",
        variant: "destructive"
      });
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png'
    ];

    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid File Type",
        description: "Please select a PDF, DOC, DOCX, JPG, or PNG file",
        variant: "destructive"
      });
      return;
    }

    uploadMutation.mutate(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    toast({
      title: "File Removed",
      description: "File has been removed from evidence"
    });
  };

  const handleNoEvidenceChange = (checked: boolean) => {
    setNoEvidenceChecked(checked);
    if (checked) {
      setEvidenceText('No supporting evidence is available for this phase');
      setUploadedFiles([]);
    } else {
      setEvidenceText('');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    if (type.includes('word')) return '📝';
    return '📎';
  };

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5" />
          Supporting Evidence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Evidence Text Input */}
        <div className="space-y-2">
          <Label htmlFor="evidenceText">Evidence Description</Label>
          <Textarea
            id="evidenceText"
            placeholder="Describe the supporting evidence (documents, photos, certificates, etc.)"
            value={evidenceText}
            onChange={(e) => setEvidenceText(e.target.value)}
            disabled={noEvidenceChecked}
            className="min-h-20"
          />
        </div>

        {/* File Upload Area */}
        {!noEvidenceChecked && (
          <div className="space-y-3">
            <Label>File Attachments</Label>
            
            {/* Drag & Drop Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${
                isDragOver
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              } ${uploadMutation.isPending ? 'opacity-50' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className="h-10 w-10 mx-auto text-gray-400 mb-3" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">
                  Drop files here or{' '}
                  <Label htmlFor="fileInput" className="text-blue-600 hover:text-blue-500 cursor-pointer">
                    browse
                  </Label>
                </p>
                <p className="text-xs text-gray-500">
                  PDF, DOC, DOCX, JPG, PNG up to 10MB
                </p>
                <input
                  id="fileInput"
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  disabled={uploadMutation.isPending}
                />
              </div>
              
              {uploadMutation.isPending && (
                <div className="mt-3">
                  <div className="inline-flex items-center gap-2 text-sm text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Uploading...
                  </div>
                </div>
              )}
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Attached Files</Label>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{getFileIcon(file.type)}</span>
                        <div>
                          <p className="text-sm font-medium text-green-800">{file.name}</p>
                          <p className="text-xs text-green-600">
                            {formatFileSize(file.size)} • Uploaded {file.uploadDate.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-700">
                          <Check className="h-3 w-3 mr-1" />
                          Uploaded
                        </Badge>
                        {file.url && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(file.url, '_blank')}
                            className="h-8"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeFile(index)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Evidence Checkbox */}
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="noEvidence"
              checked={noEvidenceChecked}
              onChange={(e) => handleNoEvidenceChange(e.target.checked)}
              className="mt-1 rounded"
            />
            <div className="flex-1">
              <Label htmlFor="noEvidence" className="text-sm font-medium text-orange-800 cursor-pointer">
                No supporting evidence is available
              </Label>
              <p className="text-xs text-orange-700 mt-1">
                Check this box if no evidence can be provided for this phase. This will be documented in the CAPA record.
              </p>
            </div>
            <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0" />
          </div>
        </div>

        {/* Evidence Summary */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700">Evidence Status:</span>
            <div className="flex items-center gap-2">
              {noEvidenceChecked ? (
                <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  No Evidence
                </Badge>
              ) : uploadedFiles.length > 0 || evidenceText.trim() ? (
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  <Check className="h-3 w-3 mr-1" />
                  Evidence Provided
                </Badge>
              ) : (
                <Badge variant="outline">
                  Pending
                </Badge>
              )}
            </div>
          </div>
          
          {!noEvidenceChecked && (
            <div className="mt-2 text-xs text-gray-600">
              <p>Files: {uploadedFiles.length} • Text: {evidenceText.trim() ? 'Provided' : 'Not provided'}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default EvidenceManager;