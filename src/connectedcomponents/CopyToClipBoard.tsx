import * as React from 'react';
import { IconButton, Snackbar } from '@mui/material';
import CopyToClipBoardIcon from '@mui/icons-material/ContentCopy';

export interface CopyButtonProps {
  text: string;
  info: string;
}
export const CopyToClipBoard = ({
  text,
  info = '',
}: CopyButtonProps): React.ReactElement => {
  const [snackBarOpen, setSnackOpen] = React.useState(false);

  const copyTextToClipBoard = (_text: string): void => {
    setTimeout(() => {
      // eslint-disable-next-line no-void
      void navigator.clipboard.writeText(_text).then(() => {
        setSnackOpen(true);
      });
    }, 2);
  };
  const message = `Copied ${info || ''} to clipboard \u2705`;
  return (
    <>
      <Snackbar
        open={snackBarOpen}
        autoHideDuration={2000}
        onClose={() => {
          setSnackOpen(false);
        }}
        message={message}
      />
      <IconButton
        aria-label="copy"
        onClick={() => {
          copyTextToClipBoard(text);
        }}
      >
        <CopyToClipBoardIcon />
      </IconButton>
    </>
  );
};
