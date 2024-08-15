import * as React from 'react';
import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddDataComponent, { DataElementType } from './AddDataComponent';
import { useAppDispatch } from '../store/store';
import { thunks } from '../store/thunks';

interface AdagucAddDataDialogProps {
  isDialogOpen: boolean;
  onDialogOpen: (open: boolean) => void;
}
const AdagucAddDataDialog = ({
  isDialogOpen,
  onDialogOpen,
}: AdagucAddDataDialogProps): React.ReactElement => {
  const dispatch = useAppDispatch();
  const mapId = 'map1';

  const handleAddData = (args: DataElementType) => {
    onDialogOpen(false);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    dispatch(
      thunks.addLayer({
        mapId,
        serviceUrl: args.service,
        name: args.layer,
      }),
    )
      .unwrap()
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.warn(e);
      });
  };
  return (
    <Dialog
      open={isDialogOpen}
      onClose={() => {
        onDialogOpen(false);
      }}
      maxWidth="lg"
      fullWidth
    >
      <DialogTitle>Add data</DialogTitle>{' '}
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
      <DialogContent style={{ height: '70vh' }}>
        <AddDataComponent handleAddData={handleAddData} />
      </DialogContent>
    </Dialog>
  );
};
export default AdagucAddDataDialog;
