/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable react/jsx-props-no-spreading */
import * as React from 'react';
import axios from 'axios';
import Grid from '@mui/material/Grid';
import { Backdrop, CircularProgress } from '@mui/material';
import {
  MapView,
  MapViewLayer,
  Legend,
  MapViewLayerProps,
} from '@opengeoweb/webmap-react';
import {
  LayerProps,
  LayerType,
  WMBBOX,
  WMGetServiceFromStore,
  WMJSMap,
  WMJSService,
  generateMapId,
  getWMJSMapById,
  getWMLayerById,
} from '@opengeoweb/webmap';

import { Layer } from '@opengeoweb/store/src/store/mapStore/types';
import { baseLayerWorldMap } from '../utils/layerDefinitions';
import {
  getWMSBaseLayerServiceUrl,
  getWMSServiceUrl,
} from '../utils/demoApiMethods';
import WMSLayerSelector from './WMSComponents/WMSLayerSelector';
import WMSDimTimeYearSelector, {
  TimeMode,
} from './WMSComponents/WMSDimTimeYearSelector';
import selectLayer from '../utils/selectLayer';
import WMSDimensionSlider from './WMSComponents/WMSDimensionSlider';
import sanitizeHTML from '../utils/sanitizeHTML';
import WMSStyleSelector from './WMSComponents/WMSStyleSelector';

// eslint-disable-next-line import/prefer-default-export
export const DemoWMSViewer = (): React.ReactElement => {
  const [loading, setLoading] = React.useState(false);
  const [mapId, setMapId] = React.useState(null);
  const [layer, setLayer] = React.useState<Layer | null>(null);
  const [availableLayers, setAvailableLayers] = React.useState<LayerProps[]>(
    [],
  );
  const [selectedISOTime, setISOTime] = React.useState('');

  const [gfiInfo, setGFIInfo] = React.useState<string>('');

  const wmsService = getWMSServiceUrl();
  const wmsBaseLayerService = getWMSBaseLayerServiceUrl();

  React.useEffect(() => {
    setLoading(true);

    // Generate a mapId
    setMapId(generateMapId());

    // Load the layers from the WMS service and select the first one
    const service: WMJSService = WMGetServiceFromStore(wmsService);
    service.getLayerObjectsFlat(
      (availableLayersFromService) => {
        setAvailableLayers(availableLayersFromService);
        if (availableLayersFromService.length > 0) {
          selectLayer(availableLayersFromService[0], wmsService).then(setLayer);
        }
      },
      () => {},
      false,
    );
    setLoading(false);
  }, []);

  React.useEffect(() => {
    if (layer) {
      const wmLayer = getWMLayerById(layer.id);
      if (wmLayer) {
        const timeDim = wmLayer.getDimension('time');
        if (timeDim) {
          setISOTime(timeDim.getValue());
        }
      }
    }
  }, [layer]);

  React.useEffect(() => {
    if (layer && selectedISOTime) {
      const wmLayer = getWMLayerById(layer.id);
      const timeDim = wmLayer.getDimension('time');
      wmLayer.parentMap.setDimension('time', selectedISOTime);
      timeDim.setValue(selectedISOTime);
      wmLayer.parentMap.draw();
    }
  }, [selectedISOTime]);

  if (!layer) {
    return null;
  }

  const handleMapClick = (map: WMJSMap, event) => {
    // eslint-disable-next-line no-console
    if (map.getLayers().length < 1) return;
    const tevent = event as unknown as {
      mouseX: number;
      mouseY: number;
    };
    map.mapPin.showMapPin();

    const url = map.getWMSGetFeatureInfoRequestURL(
      map.getLayers()[0],
      tevent.mouseX,
      tevent.mouseY,
      'text/html',
    );
    setGFIInfo('Loading...');
    axios.get(url).then((result) => {
      setGFIInfo(result.data);
    });
  };

  return (
    <Grid container direction="column" style={{ background: 'white' }}>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      <Grid item xs={6} container style={{ height: '100%' }}>
        <Grid item container direction="column" xs={5}>
          {/* Left menu */}
          <Grid container direction="row" sx={{ height: '100%' }}>
            <Grid item xs={12} container direction="column" sx={{ mr: 2 }}>
              <Grid container direction="row" sx={{ mb: 2 }}>
                <Grid item sx={{ ml: 2, mt: 2 }}>
                  <WMSLayerSelector
                    layer={layer}
                    layers={availableLayers}
                    onSelectLayer={(selectedLayer) => {
                      selectLayer(selectedLayer, wmsService).then(setLayer);
                    }}
                  />
                </Grid>

                <Grid item sx={{ ml: 2, mt: 2, width: '100%' }}>
                  <Grid sx={{ ml: 0, mt: 2, mr: 0, width: '100%' }}>
                    <WMSDimensionSlider
                      selectedDimensionValue={selectedISOTime}
                      layerId={layer.id}
                      onSelectDimensionValue={setISOTime}
                      dimensionName="time"
                    />
                  </Grid>

                  <Grid container>
                    <WMSDimTimeYearSelector
                      selectedISOTime={selectedISOTime}
                      layerId={layer.id}
                      onSelectTime={setISOTime}
                      mode={TimeMode.YEAR}
                    />
                    <WMSDimTimeYearSelector
                      selectedISOTime={selectedISOTime}
                      layerId={layer.id}
                      onSelectTime={setISOTime}
                      mode={TimeMode.MONTH}
                    />

                    <WMSDimTimeYearSelector
                      selectedISOTime={selectedISOTime}
                      layerId={layer.id}
                      onSelectTime={setISOTime}
                      mode={TimeMode.DAY}
                    />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item sx={{ ml: 2, mt: 2, width: '100%' }}>
                <WMSStyleSelector
                  layer={layer}
                  onSelectStyle={(data) => {
                    setLayer(data);
                  }}
                />
              </Grid>
              <Grid item style={{ margin: '20px' }}>
                <Legend layer={layer} />
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        <Grid
          item
          container
          direction="column"
          xs={7}
          style={{ overflow: 'hidden' }}
        >
          <MapView
            mapId={mapId}
            shouldAutoFetch={false}
            // onWMJSMount={() => {
            //   setTimeout(() => {
            //     console.log('Mount');
            //     const wmjsMap = getWMJSMapById(mapId);
            //     wmjsMap.setProjection(
            //       'EPSG:32661',
            //       new WMBBOX({
            //         left: -771068.23748231,
            //         bottom: -5835133.782045104,
            //         right: 5689551.034721555,
            //         top: 980464.571049,
            //       }),
            //     );
            //     wmjsMap.draw();
            //   }, 100);
            // }}
            listeners={[
              {
                name: 'onmapready',
                keep: false,
                data: null,
                callbackfunction: () => {
                  setTimeout(() => {
                    const wmjsMap = getWMJSMapById(mapId);
                    wmjsMap.setProjection(
                      'EPSG:32661',
                      new WMBBOX(
                        -771068.23748231,
                        -4835133.782045104,
                        5689551.034721555,
                        980464.571049,
                      ),
                    );
                    wmjsMap.draw();
                  }, 100);
                },
              },
              {
                name: 'beforemouseup',
                data: null,
                keep: true,
                callbackfunction: (map, event) => {
                  handleMapClick(map, event);
                  return true;
                },
              },
            ]}
          >
            <MapViewLayer {...baseLayerWorldMap} />

            <MapViewLayer
              id={layer.id}
              {...(layer as unknown as MapViewLayerProps)}
            />
            <MapViewLayer
              id="overlay"
              {...({
                service: wmsBaseLayerService,
                name: 'overlay_europe',
                format: 'image/webp',
                enabled: true,
                layerType: LayerType.overLayer,
              } as unknown as MapViewLayerProps)}
            />
            <MapViewLayer
              id="graticules10"
              {...({
                service: wmsBaseLayerService,
                name: 'graticules10',
                format: 'image/webp',
                enabled: true,
                layerType: LayerType.overLayer,
              } as unknown as MapViewLayerProps)}
            />
          </MapView>
        </Grid>
      </Grid>
      <Grid item xs={4} container style={{ overflow: 'hidden' }}>
        <div
          style={{
            fontSize: '11px',
            padding: '6px',
            margin: '0',
            fontFamily: 'Roboto,Helvetica,Arial,sans-serif',
            fontWeight: '400',
            lineHeight: '1.75',
            letterSpacing: '0.25px',
          }}
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={sanitizeHTML(gfiInfo)}
        />
      </Grid>
    </Grid>
  );
};
