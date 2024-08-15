import React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';
import { WMGetServiceFromStore, getWMLayerById } from '@opengeoweb/webmap';
import ProjectionSelector from './ProjectionSelector';
import AdagucNCDumpPanel from './AdagucNCDumpPanel';
import WMSColorRangeSelector from './WMSColorRangeSelector';
import { CopyToClipBoard } from '../CopyToClipBoard';

export interface LayerDetailsComponentProps {
  layerId: string;
}

interface TabPanelProps {
  children: React.ReactNode;
  index: number;
  value: number;
}

const CustomTabPanel = (props: TabPanelProps) => {
  const { children, value, index } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      style={{
        height: '100%',
        margin: '0px',
      }}
    >
      {value === index && <Box sx={{ p: 0, height: '100%' }}>{children}</Box>}
    </div>
  );
};

const LayerDetailsComponent = ({
  layerId,
}: LayerDetailsComponentProps): React.ReactElement<LayerDetailsComponentProps> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [layerIdState, setLayerId] = React.useState(layerId);
  const [value, setValue] = React.useState(0);

  // For testing purposes
  // React.useEffect(() => {
  //   if (layerIdState.length === 0) {
  //     window.setTimeout(() => {
  //       const layeriD = getWMJSMapById('map1')?.getLayers()[0].id;
  //       setLayerId(layeriD);
  //     }, 1000);
  //   }
  // }, []);

  const wmLayer = getWMLayerById(layerIdState);

  if (!wmLayer) {
    return <div>No layer found</div>;
  }

  // return <ProjectionSelector wmLayer={wmLayer} />;

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const [layerObject, setLayerObject] = React.useState<object>();

  React.useEffect(() => {
    setLayerObject({});
    WMGetServiceFromStore(wmLayer.service).getLayerObjectsFlat(
      (s) => {
        const r = s.filter((_layer) => {
          return _layer?.name === wmLayer?.name;
        });
        if (r.length === 1) {
          setLayerObject(r[0]);
        }
      },
      (e) => {
        // eslint-disable-next-line no-console
        console.error(e);
      },
      false,
    );
  }, []);

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="basic tabs example"
        >
          <Tab label="WMS Color range" />
          <Tab label="WMS Details" />
          <Tab label="Coordinate reference systems" />
          <Tab label="Adaguc NCDump" />
        </Tabs>
      </Box>
      <Box sx={{ height: '100%' }}>
        <CustomTabPanel value={value} index={0}>
          <WMSColorRangeSelector wmLayer={wmLayer} />
        </CustomTabPanel>
        <CustomTabPanel value={value} index={1}>
          Details
          <hr />
          WMS Service link:
          <CopyToClipBoard info="WMS Service link" text={wmLayer.service} />
          <a target="_blank" rel="noreferrer" href={wmLayer.service}>
            {wmLayer.service}
          </a>
          <hr />
          Layer name
          <CopyToClipBoard info="WMS Layer name" text={wmLayer.name} />
          <a target="_blank" rel="noreferrer" href={wmLayer.name}>
            {wmLayer.name}
          </a>
          <div
            style={{
              overflow: 'scroll',
              height: '400px',
              margin: '5px',
              padding: '5px',
              fontSize: '10px',
              fontFamily: 'courier',
              background: 'white',
            }}
          >
            <CopyToClipBoard
              info="WMS layerObject"
              text={JSON.stringify(layerObject, null, 2)}
            />
            <pre>{JSON.stringify(layerObject, null, 2)}</pre>
          </div>
        </CustomTabPanel>
        <CustomTabPanel value={value} index={2}>
          <ProjectionSelector wmLayer={wmLayer} />
        </CustomTabPanel>
        <CustomTabPanel value={value} index={3}>
          <AdagucNCDumpPanel wmLayer={wmLayer} />
        </CustomTabPanel>
      </Box>
    </Box>
  );
};

export default LayerDetailsComponent;
