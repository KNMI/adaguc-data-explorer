/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';

import { Style, getWMLayerById } from '@opengeoweb/webmap';
import { Card, CardContent, CardHeader, Grid, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CenterFocusStrongIcon from '@mui/icons-material/CenterFocusStrong';
import WMSDimensionSlider from '../WMSComponents/WMSDimensionSlider';
import WMSStyleSelector from '../WMSComponents/WMSStyleSelector';
import WMSLayerSelector from './WMSLayerSelector';
import { AdagucLayer } from '../../store/types';

export interface LayerComponentProps {
  serviceUrl: string;
  layer: AdagucLayer;
  selectedStyleName: string;
  styles: Style[];
  onSelectLayer: (layerName: string) => void;
  onSelectStyle: (style: string) => void;
  getDimensionValue: (dimensionName: string) => string;
  setDimensionValue: (dimensionName: string, dimensionValue: string) => void;
  removeLayer: () => void;
  update: () => void;
}
export const LayerComponent = ({
  serviceUrl,
  layer,
  onSelectLayer,
  onSelectStyle,
  selectedStyleName,
  styles,
  getDimensionValue,
  setDimensionValue,
  removeLayer,
  update: updateParent,
}: LayerComponentProps): React.ReactElement<LayerComponentProps> => {
  const [count, setUpdate] = React.useState(0);

  const update = () => {
    updateParent();
    setUpdate((count + 1) % 10);
  };
  const cardTitle = `${getWMLayerById(layer?.id)?.title}`;
  const cardSubTitle = `Layer ${getWMLayerById(layer?.id)?.name}`;
  const cardActions = (
    <>
      <IconButton
        size="small"
        edge="end"
        color="inherit"
        aria-label="menu"
        onClick={() => {
          getWMLayerById(layer?.id)?.zoomToLayer();
          getWMLayerById(layer?.id)?.parentMap?.draw();
        }}
      >
        <CenterFocusStrongIcon />
      </IconButton>
      <IconButton
        size="small"
        edge="end"
        color="inherit"
        aria-label="menu"
        onClick={() => {
          const wmLayer = getWMLayerById(layer?.id);
          if (wmLayer) {
            wmLayer.enabled = !wmLayer.enabled;
            update();
          }
        }}
      >
        {getWMLayerById(layer?.id)?.enabled ? (
          <VisibilityIcon />
        ) : (
          <VisibilityOffIcon />
        )}
      </IconButton>
      <IconButton
        size="small"
        edge="end"
        color="inherit"
        aria-label="menu"
        onClick={() => {
          removeLayer();
        }}
      >
        <CloseIcon />
      </IconButton>
    </>
  );

  return (
    <Card style={{ padding: '0px', marginTop: '0px', marginBottom: '5px' }}>
      <CardHeader
        title={cardTitle}
        subheader={cardSubTitle}
        action={cardActions}
        style={{ borderBottom: '2px solid #888' }}
      />
      <CardContent>
        <Grid container direction="column">
          <Grid item sx={{ paddingBottom: 1 }} style={{ width: 'inherit' }}>
            <WMSLayerSelector
              layerName={layer?.name}
              serviceUrl={serviceUrl}
              onSelectLayer={onSelectLayer}
            />
          </Grid>

          <Grid item sx={{ paddingBottom: 1 }} style={{ width: 'inherit' }}>
            <WMSStyleSelector
              styleName={selectedStyleName}
              styles={styles}
              onSelectStyle={(styleName) => {
                onSelectStyle(styleName);
              }}
            />
          </Grid>
          <Grid item sx={{ paddingBottom: 1 }} style={{ width: 'inherit' }}>
            {getWMLayerById(layer?.id)?.dimensions.map((layerDimension) => {
              return (
                <WMSDimensionSlider
                  key={layerDimension.name}
                  selectedDimensionValue={getDimensionValue(
                    layerDimension.name,
                  )}
                  layerId={layer?.id}
                  onSelectDimensionValue={(value) => {
                    setDimensionValue(layerDimension.name, value);
                  }}
                  dimensionName={layerDimension.name}
                />
              );
            })}
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

// export const LayerComponentAppbar = ({
//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   serviceUrl,
//   layer,
//   onSelectLayer,
//   onSelectStyle,
//   availableLayers,
//   selectedStyleName,
//   styles,
//   getDimensionValue,
//   setDimensionValue,
//   removeLayer,
//   update: updateParent,
// }: LayerComponentProps): React.ReactElement<LayerComponentProps> => {
//   const [count, setUpdate] = React.useState(0);

//   const update = () => {
//     updateParent();
//     setUpdate((count + 1) % 10);
//   };
//   return (
//     <ThemeWrapper>
//       <Grid container direction="column" style={{ background: 'white' }}>
//         <AppBar position="static">
//           <Toolbar variant="dense">
//             <Typography
//               variant="subtitle1"
//               component="div"
//               sx={{ flexGrow: 1 }}
//             >
//               Layer {getWMLayerById(layer?.id)?.name}
//             </Typography>
//             <IconButton
//               size="small"
//               edge="end"
//               color="inherit"
//               aria-label="menu"
//               onClick={() => {
//                 getWMLayerById(layer?.id)?.zoomToLayer();
//                 getWMLayerById(layer?.id)?.parentMap?.draw();
//               }}
//             >
//               <CenterFocusStrongIcon />
//             </IconButton>
//             <IconButton
//               size="small"
//               edge="end"
//               color="inherit"
//               aria-label="menu"
//               onClick={() => {
//                 const wmLayer = getWMLayerById(layer?.id);
//                 if (wmLayer) {
//                   wmLayer.enabled = !wmLayer.enabled;
//                   update();
//                 }
//               }}
//             >
//               {getWMLayerById(layer?.id)?.enabled ? (
//                 <VisibilityIcon />
//               ) : (
//                 <VisibilityOffIcon />
//               )}
//             </IconButton>
//             <IconButton
//               size="small"
//               edge="end"
//               color="inherit"
//               aria-label="menu"
//               onClick={() => {
//                 removeLayer();
//               }}
//             >
//               <CloseIcon />
//             </IconButton>
//           </Toolbar>
//         </AppBar>
//         <Grid container direction="column">
//           <Grid item sx={{ p: 1 }} style={{ width: 'inherit' }}>
//             <WMSLayerSelector
//               layerName={layer?.name}
//               layers={availableLayers}
//               onSelectLayer={onSelectLayer}
//             />
//           </Grid>

//           <Grid item sx={{ p: 1 }} style={{ width: 'inherit' }}>
//             <WMSStyleSelector
//               styleName={selectedStyleName}
//               styles={styles}
//               onSelectStyle={(styleName) => {
//                 onSelectStyle(styleName);
//               }}
//             />
//           </Grid>
//           <Grid item sx={{ p: 1 }} style={{ width: 'inherit' }}>
//             {getWMLayerById(layer?.id)?.dimensions.map((layerDimension) => {
//               return (
//                 <WMSDimensionSlider
//                   key={layerDimension.name}
//                   selectedDimensionValue={getDimensionValue(
//                     layerDimension.name,
//                   )}
//                   layerId={layer?.id}
//                   onSelectDimensionValue={(value) => {
//                     setDimensionValue(layerDimension.name, value);
//                   }}
//                   dimensionName={layerDimension.name}
//                 />
//               );
//             })}
//           </Grid>
//         </Grid>
//       </Grid>
//     </ThemeWrapper>
//   );
// };
