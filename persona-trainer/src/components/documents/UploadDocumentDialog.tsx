import { useState, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  TextField,
  Typography,
  LinearProgress,
  Alert
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { supabase } from '../../services/supabase/client';
import type { TrainingDocument } from '../../services/supabase/client';
import { extractText, validateFile } from '../../services/documents/extractor';
import { useAuth } from '../../contexts/AuthContext';

interface UploadDocumentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (doc: TrainingDocument) => void;
}

function getFileType(file: File): 'pdf' | 'docx' | 'txt' | 'md' {
  const name = file.name.toLowerCase();
  if (name.endsWith('.pdf')) return 'pdf';
  if (name.endsWith('.docx')) return 'docx';
  if (name.endsWith('.md')) return 'md';
  return 'txt';
}

const UploadDocumentDialog = ({ open, onClose, onSuccess }: UploadDocumentDialogProps) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractionWarning, setExtractionWarning] = useState(false);

  const handleReset = () => {
    setSelectedFile(null);
    setName('');
    setDescription('');
    setError(null);
    setExtractionWarning(false);
    setUploading(false);
    setIsDragOver(false);
  };

  const handleClose = () => {
    if (uploading) return;
    handleReset();
    onClose();
  };

  const applyFile = (file: File) => {
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSelectedFile(file);
    setName(file.name.replace(/\.[^/.]+$/, ''));
    setError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) applyFile(file);
    e.target.value = '';
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) applyFile(file);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile || !name.trim() || !user) return;

    setUploading(true);
    setError(null);
    setExtractionWarning(false);

    try {
      const extraction = await extractText(selectedFile);
      if (!extraction) setExtractionWarning(true);

      const uniqueFilename = `${crypto.randomUUID()}-${selectedFile.name}`;
      const { data: storageData, error: storageError } = await supabase.storage
        .from('training-documents')
        .upload(uniqueFilename, selectedFile);

      if (storageError) throw storageError;

      const { data: docData, error: docError } = await supabase
        .from('training_documents')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          file_type: getFileType(selectedFile),
          file_size: selectedFile.size,
          file_url: storageData.path,
          extracted_text: extraction?.text ?? null,
          character_count: extraction?.characterCount ?? null,
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (docError) throw docError;

      onSuccess(docData as TrainingDocument);
      handleReset();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const canSubmit = selectedFile && name.trim() && !uploading;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Upload Training Document</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Drop zone */}
          <Box
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !selectedFile && fileInputRef.current?.click()}
            sx={{
              border: '2px dashed',
              borderColor: isDragOver ? 'primary.main' : selectedFile ? 'success.main' : 'grey.400',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              cursor: selectedFile ? 'default' : 'pointer',
              bgcolor: isDragOver ? 'primary.50' : 'grey.50',
              transition: 'border-color 0.2s, background-color 0.2s',
            }}
          >
            <UploadFileIcon sx={{ fontSize: 40, color: selectedFile ? 'success.main' : 'grey.400', mb: 1 }} />
            {selectedFile ? (
              <>
                <Typography variant="body1" fontWeight={500}>{selectedFile.name}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {(selectedFile.size / 1024).toFixed(0)} KB
                </Typography>
                <Box sx={{ mt: 1 }}>
                  <Button size="small" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                    Change file
                  </Button>
                </Box>
              </>
            ) : (
              <>
                <Typography variant="body1">Drag and drop a file here, or click to browse</Typography>
                <Typography variant="caption" color="text.secondary">
                  PDF, Word (.docx), Text (.txt), or Markdown (.md) — max 10 MB
                </Typography>
              </>
            )}
          </Box>

          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.md"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />

          <TextField
            label="Document Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
            variant="outlined"
            helperText="A clear name for this document"
            disabled={uploading}
          />

          <TextField
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={2}
            variant="outlined"
            helperText="Briefly describe the document's purpose or content"
            disabled={uploading}
          />

          {uploading && <LinearProgress />}

          {extractionWarning && (
            <Alert severity="warning">
              Document uploaded, but text extraction failed. The AI won&apos;t be able to use this document&apos;s content.
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={uploading}>Cancel</Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={!canSubmit}
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UploadDocumentDialog;
