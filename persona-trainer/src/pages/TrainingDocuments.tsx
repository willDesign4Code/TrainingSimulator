import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { supabase } from '../services/supabase/client';
import type { TrainingDocument } from '../services/supabase/client';
import UploadDocumentDialog from '../components/documents/UploadDocumentDialog';
import { useAuth } from '../contexts/AuthContext';

const FILE_TYPE_COLORS: Record<string, 'error' | 'primary' | 'default' | 'success'> = {
  pdf: 'error',
  docx: 'primary',
  txt: 'default',
  md: 'success',
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface DocumentRow extends TrainingDocument {
  uploader_name?: string;
  scenario_count: number;
}

const TrainingDocuments = () => {
  const { userProfile } = useAuth();
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [users, setUsers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('');

  const [openUpload, setOpenUpload] = useState(false);
  const [openPreview, setOpenPreview] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRow | null>(null);
  const [linkedScenarios, setLinkedScenarios] = useState<{ id: string; title: string }[]>([]);
  const [deleting, setDeleting] = useState(false);

  const isAdminOrManager = userProfile?.role === 'admin' || userProfile?.role === 'manager';

  const fetchDocuments = async () => {
    try {
      setLoading(true);

      const [{ data: docsData, error: docsError }, { data: usersData, error: usersError }] = await Promise.all([
        supabase
          .from('training_documents')
          .select('*, scenario_documents(count)')
          .order('created_at', { ascending: false }),
        supabase
          .from('users')
          .select('id, name'),
      ]);

      if (docsError) throw docsError;
      if (usersError) throw usersError;

      const userMap: Record<string, string> = {};
      (usersData || []).forEach((u: { id: string; name: string }) => { userMap[u.id] = u.name; });
      setUsers(userMap);

      const rows: DocumentRow[] = (docsData || []).map((d: TrainingDocument & { scenario_documents?: { count: number }[] }) => ({
        ...d,
        uploader_name: userMap[d.uploaded_by] ?? 'Unknown user',
        scenario_count: d.scenario_documents?.[0]?.count ?? 0,
      }));
      setDocuments(rows);
      setError(null);
    } catch {
      setError('Failed to load documents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdminOrManager) fetchDocuments();
  }, [isAdminOrManager]);

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = fileTypeFilter ? doc.file_type === fileTypeFilter : true;
    return matchesSearch && matchesType;
  });

  const handleUploadSuccess = (doc: TrainingDocument) => {
    const newRow: DocumentRow = {
      ...doc,
      uploader_name: users[doc.uploaded_by] ?? 'Unknown user',
      scenario_count: 0,
    };
    setDocuments((prev) => [newRow, ...prev]);
  };

  const handleOpenPreview = (doc: DocumentRow) => {
    setSelectedDoc(doc);
    setOpenPreview(true);
  };

  const handleDownload = async (doc: DocumentRow) => {
    try {
      const { data, error } = await supabase.storage
        .from('training-documents')
        .createSignedUrl(doc.file_url, 60);
      if (error) throw error;
      const a = document.createElement('a');
      a.href = data.signedUrl;
      a.download = doc.name;
      a.click();
    } catch {
      setError('Failed to generate download link.');
    }
  };

  const handleOpenDelete = async (doc: DocumentRow) => {
    setSelectedDoc(doc);
    const { data, error } = await supabase
      .from('scenario_documents')
      .select('scenario_id, scenarios(title)')
      .eq('document_id', doc.id);

    if (error) {
      setError('Could not load linked scenarios. Please try again.');
      return;
    }

    setLinkedScenarios(
      (data || []).map((row: { scenario_id: string; scenarios: Array<{ title: string | null }> | null }) => ({
        id: row.scenario_id,
        title: row.scenarios?.[0]?.title ?? 'Unknown',
      }))
    );
    setOpenDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedDoc) return;
    setDeleting(true);
    try {
      const { error: dbError } = await supabase
        .from('training_documents')
        .delete()
        .eq('id', selectedDoc.id);
      if (dbError) throw dbError;

      const { error: storageError } = await supabase.storage
        .from('training-documents')
        .remove([selectedDoc.file_url]);
      if (storageError) {
        console.warn('Storage file could not be removed:', storageError.message);
      }

      setDocuments((prev) => prev.filter((d) => d.id !== selectedDoc.id));
      setOpenDelete(false);
      setSelectedDoc(null);
    } catch {
      setError('Failed to delete document.');
    } finally {
      setDeleting(false);
    }
  };

  if (!isAdminOrManager) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Access denied. This page is only available to admins and managers.</Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ px: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Training Documents</Typography>
        <Button
          variant="contained"
          startIcon={<UploadFileIcon />}
          onClick={() => setOpenUpload(true)}
        >
          Upload Document
        </Button>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Search and filter */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search by name..."
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ flexGrow: 1, maxWidth: 400 }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>File Type</InputLabel>
          <Select
            value={fileTypeFilter}
            label="File Type"
            onChange={(e) => setFileTypeFilter(e.target.value)}
          >
            <MenuItem value="">All Types</MenuItem>
            <MenuItem value="pdf">PDF</MenuItem>
            <MenuItem value="docx">Word (.docx)</MenuItem>
            <MenuItem value="txt">Text (.txt)</MenuItem>
            <MenuItem value="md">Markdown (.md)</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Documents table */}
      <TableContainer component={Paper} elevation={2}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Uploaded</TableCell>
              <TableCell>Uploader</TableCell>
              <TableCell align="center">Scenarios</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredDocs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">
                    {documents.length === 0
                      ? 'No documents uploaded yet. Click "Upload Document" to get started.'
                      : 'No documents match your search.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredDocs.map((doc) => (
                <TableRow key={doc.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{doc.name}</Typography>
                    {doc.description && (
                      <Typography variant="caption" color="text.secondary">{doc.description}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={doc.file_type.toUpperCase()}
                      size="small"
                      color={FILE_TYPE_COLORS[doc.file_type] ?? 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{formatBytes(doc.file_size)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(doc.created_at).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{doc.uploader_name}</Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={doc.scenario_count}
                      size="small"
                      color={doc.scenario_count > 0 ? 'primary' : 'default'}
                      variant={doc.scenario_count > 0 ? 'filled' : 'outlined'}
                      aria-label={`${doc.scenario_count} linked scenario${doc.scenario_count !== 1 ? 's' : ''}`}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Preview extracted text">
                      <IconButton size="small" aria-label={`Preview ${doc.name}`} onClick={() => handleOpenPreview(doc)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download original file">
                      <IconButton size="small" aria-label={`Download ${doc.name}`} onClick={() => handleDownload(doc)}>
                        <DownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete document">
                      <IconButton size="small" color="error" aria-label={`Delete ${doc.name}`} onClick={() => handleOpenDelete(doc)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Upload dialog */}
      <UploadDocumentDialog
        open={openUpload}
        onClose={() => setOpenUpload(false)}
        onSuccess={handleUploadSuccess}
      />

      {/* Preview dialog */}
      <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth="md" fullWidth>
        <DialogTitle>{selectedDoc?.name}</DialogTitle>
        <DialogContent>
          {selectedDoc && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Chip label={selectedDoc.file_type.toUpperCase()} size="small" color={FILE_TYPE_COLORS[selectedDoc.file_type] ?? 'default'} variant="outlined" />
                <Typography variant="body2" color="text.secondary">{formatBytes(selectedDoc.file_size)}</Typography>
                {selectedDoc.character_count != null && (
                  <>
                    <Typography variant="body2" color="text.secondary">
                      {selectedDoc.character_count.toLocaleString()} chars
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      ~{Math.ceil(selectedDoc.character_count / 4).toLocaleString()} tokens
                    </Typography>
                  </>
                )}
              </Box>
              {selectedDoc.extracted_text ? (
                <Box
                  tabIndex={0}
                  role="region"
                  aria-label="Extracted document text"
                  sx={{
                    fontFamily: 'monospace',
                    fontSize: '0.8rem',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    maxHeight: '50vh',
                    overflowY: 'auto',
                    bgcolor: 'grey.50',
                    p: 2,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'grey.200',
                  }}
                >
                  {selectedDoc.extracted_text}
                </Box>
              ) : (
                <Alert severity="warning">
                  Text extraction failed for this document. The AI cannot use its content.
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => selectedDoc && handleDownload(selectedDoc)}>
            Download Original
          </Button>
          <Button onClick={() => setOpenPreview(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog open={openDelete} onClose={() => !deleting && setOpenDelete(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete Document</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Typography>
              Are you sure you want to delete <strong>{selectedDoc?.name}</strong>? This cannot be undone.
            </Typography>
            {linkedScenarios.length > 0 && (
              <Alert severity="warning">
                <Typography variant="body2" gutterBottom>
                  This document is used by <strong>{linkedScenarios.length} scenario(s)</strong> and will be removed from them:
                </Typography>
                <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
                  {linkedScenarios.map((s) => (
                    <li key={s.id}>
                      <Typography variant="body2">{s.title}</Typography>
                    </li>
                  ))}
                </ul>
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenDelete(false)} disabled={deleting}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" disabled={deleting}>
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TrainingDocuments;
