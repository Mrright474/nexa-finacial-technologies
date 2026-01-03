import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Upload, Camera, FileCheck, Loader2, X, CheckCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadedDoc {
  type: 'id_front' | 'id_back' | 'selfie';
  fileName: string;
  status: 'pending' | 'verified' | 'rejected';
}

const documentTypes = [
  { id: 'id_front', label: 'ID Front', icon: FileCheck, description: 'Front side of your government-issued ID' },
  { id: 'id_back', label: 'ID Back', icon: FileCheck, description: 'Back side of your government-issued ID' },
  { id: 'selfie', label: 'Selfie', icon: Camera, description: 'A clear photo of your face' },
] as const;

export function KycUpload() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDoc[]>([]);
  const [existingDocs, setExistingDocs] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  // Fetch existing documents on mount
  useState(() => {
    if (user) {
      fetchExistingDocs();
    }
  });

  const fetchExistingDocs = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('kyc_documents')
      .select('*')
      .eq('user_id', user.id);
    
    if (data) {
      setExistingDocs(data);
    }
    setLoadingDocs(false);
  };

  const handleFileUpload = async (docType: 'id_front' | 'id_back' | 'selfie', file: File) => {
    if (!user) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast({
        variant: "destructive",
        title: "Invalid file type",
        description: "Please upload an image file (JPG, PNG, etc.)",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        variant: "destructive",
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
      });
      return;
    }

    setUploading(docType);

    try {
      // Create unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${docType}_${Date.now()}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('kyc-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Save record to database
      const { error: dbError } = await supabase
        .from('kyc_documents')
        .insert({
          user_id: user.id,
          document_type: docType,
          file_name: file.name,
          file_path: fileName,
          status: 'pending',
        });

      if (dbError) throw dbError;

      setUploadedDocs(prev => [...prev, { type: docType, fileName: file.name, status: 'pending' }]);
      
      toast({
        title: "Document uploaded",
        description: `Your ${docType.replace('_', ' ')} has been submitted for review.`,
      });

      fetchExistingDocs();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message || "Failed to upload document. Please try again.",
      });
    } finally {
      setUploading(null);
    }
  };

  const getDocStatus = (docType: string) => {
    const doc = existingDocs.find(d => d.document_type === docType);
    return doc?.status || null;
  };

  const getDocFileName = (docType: string) => {
    const doc = existingDocs.find(d => d.document_type === docType);
    return doc?.file_name || null;
  };

  const allDocsUploaded = documentTypes.every(dt => getDocStatus(dt.id));
  const allDocsVerified = documentTypes.every(dt => getDocStatus(dt.id) === 'verified');

  return (
    <div className="glass-card p-6 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
          <FileCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">KYC Verification</h3>
          <p className="text-sm text-muted-foreground">
            Upload your documents to verify your identity
          </p>
        </div>
      </div>

      {allDocsVerified && (
        <div className="p-4 rounded-xl bg-success/10 border border-success/20 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-success" />
          <div>
            <p className="font-medium text-success">Verification Complete</p>
            <p className="text-sm text-muted-foreground">Your identity has been verified.</p>
          </div>
        </div>
      )}

      <div className="grid gap-4">
        {documentTypes.map((docType) => {
          const status = getDocStatus(docType.id);
          const fileName = getDocFileName(docType.id);
          const isUploading = uploading === docType.id;

          return (
            <div
              key={docType.id}
              className={cn(
                "p-4 rounded-xl border-2 border-dashed transition-all",
                status === 'verified' && "border-success/50 bg-success/5",
                status === 'pending' && "border-warning/50 bg-warning/5",
                status === 'rejected' && "border-destructive/50 bg-destructive/5",
                !status && "border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    status === 'verified' && "bg-success/20",
                    status === 'pending' && "bg-warning/20",
                    status === 'rejected' && "bg-destructive/20",
                    !status && "bg-secondary"
                  )}>
                    <docType.icon className={cn(
                      "w-5 h-5",
                      status === 'verified' && "text-success",
                      status === 'pending' && "text-warning",
                      status === 'rejected' && "text-destructive",
                      !status && "text-muted-foreground"
                    )} />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{docType.label}</p>
                    <p className="text-xs text-muted-foreground">{docType.description}</p>
                    {fileName && (
                      <p className="text-xs text-primary mt-1">{fileName}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {status && (
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium capitalize",
                      status === 'verified' && "bg-success/20 text-success",
                      status === 'pending' && "bg-warning/20 text-warning",
                      status === 'rejected' && "bg-destructive/20 text-destructive"
                    )}>
                      {status}
                    </span>
                  )}

                  {(!status || status === 'rejected') && (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(docType.id, file);
                        }}
                        disabled={isUploading}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 pointer-events-none"
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        {status === 'rejected' ? 'Re-upload' : 'Upload'}
                      </Button>
                    </label>
                  )}
                </div>
              </div>

              {status === 'rejected' && (
                <div className="mt-3 p-2 rounded-lg bg-destructive/10 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <p className="text-xs text-destructive">Document rejected. Please upload a clearer image.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {!allDocsUploaded && (
        <p className="text-sm text-muted-foreground text-center">
          Upload all documents to complete verification. Processing takes 24-48 hours.
        </p>
      )}
    </div>
  );
}