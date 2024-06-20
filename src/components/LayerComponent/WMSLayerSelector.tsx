/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import { TreeItem } from '@mui/x-tree-view/TreeItem';
import {
  LayerProps,
  LayerTree,
  WMGetServiceFromStore,
  generateLayerId,
} from '@opengeoweb/webmap';
import selectLayer from '../../utils/selectLayer';

interface WMSLayerSelectorProps {
  layerName: string;
  serviceUrl: string;
  onSelectLayer: (layerName: string) => void;
}

interface MakeTreeProps {
  tree: LayerTree;
}
const MakeTree = ({
  tree,
}: MakeTreeProps): React.ReactElement<MakeTreeProps> => {
  if (!tree) return null;
  const { children, name: layerName, title } = tree;
  if (children && children.length > 0) {
    return (
      <TreeItem
        itemId={tree.name || tree.title || generateLayerId()}
        label={tree.title}
        aria-expanded
      >
        {children.map((child) => {
          return (
            <MakeTree
              key={child.name || child.title || generateLayerId()}
              tree={child}
            />
          );
        })}
      </TreeItem>
    );
  }
  return (
    <TreeItem
      itemId={layerName || title || generateLayerId()}
      key={layerName}
      label={`${title}`}
    />
  );
};

const WMSLayerSelector = ({
  layerName,
  serviceUrl,
  onSelectLayer,
}: WMSLayerSelectorProps): React.ReactElement<WMSLayerSelectorProps> => {
  const tree = React.useRef<LayerTree>(null);
  const layers = React.useRef<LayerProps[]>([]);
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]);
  const [menuOpen, setMenuOpen] = React.useState<boolean>(false);

  const handleSelectedItemsChange = (e, ids) => {
    const selected = ids as unknown as string;
    const selectedLayer = layers.current.find((lins) => lins.name === selected);
    if (selectedLayer && selectLayer.name) {
      setMenuOpen(false);
      onSelectLayer(selectedLayer.name);
    }
  };

  const handleExpandedItemsChange = (
    event: React.SyntheticEvent,
    itemIds: string[],
  ) => {
    setExpandedItems(itemIds);
  };

  if (!serviceUrl) {
    return null;
  }

  // eslint-disable-next-line consistent-return
  React.useEffect((): void => {
    const service = WMGetServiceFromStore(serviceUrl);
    if (!service) return null;
    if (tree.current === null) {
      service.getNodes(
        (t) => {
          tree.current = t;
          setExpandedItems([t.title]);
          service.getLayerObjectsFlat(
            (ls) => {
              layers.current = ls;
            },
            (e) => {
              // eslint-disable-next-line no-console
              console.error(e);
            },
            false,
          );
        },
        (e) => {
          // eslint-disable-next-line no-console
          console.error(e);
        },
        false,
      );
    }
  }, [serviceUrl, tree]);

  const selectedLayer = layers.current.find((lins) => lins.name === layerName);

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <FormControl size="small" sx={{ width: 'inherit' }}>
        <InputLabel size="small">Layer</InputLabel>
        <Select
          size="small"
          value={layerName}
          label="Layer"
          onChange={() => {}}
          open={menuOpen}
          onOpen={() => {
            setMenuOpen(true);
          }}
          onClose={() => {
            setMenuOpen(false);
          }}
        >
          <MenuItem
            style={{ display: 'none' }}
            key={layerName}
            value={layerName}
          >
            {selectedLayer?.title}
          </MenuItem>
          <SimpleTreeView
            selectedItems={[layerName]}
            expandedItems={expandedItems}
            onSelectedItemsChange={handleSelectedItemsChange}
            onExpandedItemsChange={handleExpandedItemsChange}
          >
            <MakeTree tree={tree.current} />
          </SimpleTreeView>
        </Select>
      </FormControl>
    </Box>
  );
};

export default WMSLayerSelector;
