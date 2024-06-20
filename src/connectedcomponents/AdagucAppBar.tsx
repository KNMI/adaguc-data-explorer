import * as React from 'react';
import {
  AppBar,
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Toolbar,
  Typography,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import AddDataComponent, { DataElementType } from './AddDataComponent';
import { useAppDispatch } from '../store/store';
import { thunks } from '../store/thunks';

const AdagucAppBar = (): React.ReactElement => {
  const [open, setOpen] = React.useState<boolean>(false);
  const dispatch = useAppDispatch();
  const mapId = 'map1';

  const handleAddData = (args: DataElementType) => {
    setOpen(false);
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
    <Box sx={{ flexGrow: 1 }}>
      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Add data</DialogTitle>{' '}
        <IconButton
          aria-label="close"
          onClick={() => {
            setOpen(false);
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
      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} />
          <Button
            color="inherit"
            onClick={() => {
              setOpen(true);
            }}
          >
            Add...
          </Button>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default AdagucAppBar;
