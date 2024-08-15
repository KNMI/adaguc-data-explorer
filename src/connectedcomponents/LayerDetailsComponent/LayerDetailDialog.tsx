import * as React from 'react';
import { Popper, DialogContent, DialogTitle, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { getWMLayerById } from '@opengeoweb/webmap';
import LayerDetailsComponent from './LayerDetailsComponent';

interface LayerDetailDialogProps {
  isDialogOpen: boolean;
  layerId: string;
  onClose: () => void;
}
const LayerDetailDialog = ({
  isDialogOpen,
  layerId,
  onClose,
}: LayerDetailDialogProps): React.ReactElement => {
  const wmLayer = getWMLayerById(layerId);

  return (
    <Popper
      style={{
        position: 'absolute',
        left: '10px',
        top: '50px',
        zIndex: 2000,
        background: 'white',
      }}
      open={isDialogOpen}
    >
      <DialogTitle>Layer details for {wmLayer?.name}</DialogTitle>{' '}
      <IconButton
        aria-label="close"
        onClick={() => {
          onClose();
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
      <DialogContent style={{ maxHeight: '60vh', maxWidth: '60vw' }}>
        <LayerDetailsComponent layerId={layerId} />
      </DialogContent>
    </Popper>
  );
};
export default LayerDetailDialog;
