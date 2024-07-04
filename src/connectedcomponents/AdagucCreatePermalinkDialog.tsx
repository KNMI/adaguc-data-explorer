import * as React from 'react';
import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import { makePermaLink } from './handleWindowLocationQueryString';
import { CopyToClipBoard } from './CopyToClipBoard';

interface AdagucCreatePermalinkDialogProps {
  isDialogOpen: boolean;
  onDialogOpen: (open: boolean) => void;
}
const AdagucCreatePermalinkDialog = ({
  isDialogOpen,
  onDialogOpen,
}: AdagucCreatePermalinkDialogProps): React.ReactElement => {
  const link = makePermaLink('map1');

  return (
    <Dialog
      open={isDialogOpen}
      onClose={() => {
        onDialogOpen(false);
      }}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>Permalink</DialogTitle>{' '}
      <IconButton
        aria-label="close"
        onClick={() => {
          onDialogOpen(false);
        }}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: (theme) => theme.palette.grey[500],
        }}
      >
        <CloseIcon />
      </IconButton>
      <DialogContent>
        <CopyToClipBoard info="link" text={link} />
        <a target="_blank" rel="noreferrer" href={link}>
          {link}
        </a>
      </DialogContent>
    </Dialog>
  );
};
export default AdagucCreatePermalinkDialog;
