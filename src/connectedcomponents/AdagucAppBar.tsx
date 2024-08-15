import * as React from 'react';
import { AppBar, Box, IconButton, Toolbar, Typography } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CreateLinkIcon from '@mui/icons-material/Link';
import AdagucAddDataDialog from './AdagucAddDataDialog';
import AdagucCreatePermalinkDialog from './AdagucCreatePermalinkDialog';

const AdagucAppBar = (): React.ReactElement => {
  const [addDataDialogOpen, setAddDataDialogOpen] =
    React.useState<boolean>(false);
  const [createLinkDialogOpen, setCreateLinkDialogOpen] =
    React.useState<boolean>(false);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AdagucAddDataDialog
        isDialogOpen={addDataDialogOpen}
        onDialogOpen={setAddDataDialogOpen}
      />
      <AdagucCreatePermalinkDialog
        isDialogOpen={createLinkDialogOpen}
        onDialogOpen={setCreateLinkDialogOpen}
      />
      <AppBar position="static">
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={() => {
              setAddDataDialogOpen(true);
            }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }} />
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
            onClick={() => {
              setCreateLinkDialogOpen(true);
            }}
          >
            <CreateLinkIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default AdagucAppBar;
