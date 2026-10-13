import * as React from 'react';
import { AppBar, Box, IconButton, Toolbar } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CreateLinkIcon from '@mui/icons-material/Link';
import AdagucAddDataDialog from './AdagucAddDataDialog';
import AdagucCreatePermalinkDialog from './AdagucCreatePermalinkDialog';
import WMSServiceInput from './WMSServiceInput';

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
      <AppBar position="static" elevation={0}>
        {/* Toolbar's default height comes from theme.mixins.toolbar, which
            sets its own minHeight at the "sm" breakpoint - a plain
            minHeight here has equal CSS specificity and can lose to that
            at desktop widths, leaving this bar shorter than intended (and
            the fixed-height header wrapper around it showing a gap below
            it). Repeating the override at "sm" too makes sure it wins at
            every size. */}
        <Toolbar sx={{ minHeight: { xs: '78px', sm: '78px' } }}>
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
          <WMSServiceInput
            sx={{
              flexGrow: 1,
              mr: 2,
              backgroundColor: 'background.paper',
              borderRadius: 1,
            }}
          />
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
