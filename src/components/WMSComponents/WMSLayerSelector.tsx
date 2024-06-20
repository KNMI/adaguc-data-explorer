// /* eslint-disable react/jsx-props-no-spreading */
// import * as React from 'react';
// import {
//   Box,
//   FormControl,
//   InputLabel,
//   MenuItem,
//   Select,
//   SelectChangeEvent,
// } from '@mui/material';
// import { LayerProps } from '@opengeoweb/webmap';
// import { Layer } from '@opengeoweb/store/src/store/mapStore/types';

// interface WMSLayerSelectorProps {
//   layer: Layer | null;
//   layers: LayerProps[];
//   onSelectLayer: (layer: LayerProps) => void;
// }

// const WMSLayerSelector = ({
//   layer,
//   layers,
//   onSelectLayer,
// }: WMSLayerSelectorProps): React.ReactElement<WMSLayerSelectorProps> => {
//   const handleChange = (event: SelectChangeEvent<string>) => {
//     const selectedLayerIndex = layers.findIndex(
//       (l) => l.name === event.target.value,
//     );
//     onSelectLayer(layers[selectedLayerIndex]);
//   };

//   const hasValidOption = layers.find((ls) => ls.name === layer?.name);

//   return (
//     <Box sx={{ height: '100%' }}>
//       <FormControl size="small">
//         <InputLabel size="small">Layer</InputLabel>
//         <Select
//           size="small"
//           value={hasValidOption ? layer?.name : 'Not set'}
//           label="Layer"
//           onChange={handleChange}
//         >
//           {layers.map((l) => (
//             <MenuItem key={l.name} value={l.name}>
//               {l.title}
//             </MenuItem>
//           ))}
//           {!hasValidOption && (
//             <MenuItem key="Not set" value="Not set">
//               Not set
//             </MenuItem>
//           )}
//         </Select>
//       </FormControl>
//     </Box>
//   );
// };

// export default WMSLayerSelector;
