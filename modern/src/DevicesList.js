import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from '@material-ui/core/styles';
import Avatar from '@material-ui/core/Avatar';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import { FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import BatteryFullIcon from '@material-ui/icons/BatteryFull';
import Battery60Icon from '@material-ui/icons/Battery60';
import Battery20Icon from '@material-ui/icons/Battery20';
import FlashOnIcon from '@material-ui/icons/FlashOn';
import FlashOffIcon from '@material-ui/icons/FlashOff';

import { devicesActions } from './store';
import EditCollectionView from './EditCollectionView';
import { useEffectAsync } from './reactHelper';
import { formatBoolean, formatPercentage, getStatusColor } from './common/formatter';
import { useTranslation } from './LocalizationProvider';
import { Tooltip } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  list: {
    maxHeight: '100%',
  },
  listInner: {
    position: 'relative',
    margin: theme.spacing(1.5, 0),
  },
  icon: {
    width: '25px',
    height: '25px',
    filter: 'brightness(0) invert(1)',
  },
  listItem: {
    backgroundColor: 'white',
    '&:hover': {
      backgroundColor: 'white',
    },
  },
  batteryText: {
    fontSize: '0.75rem',
    fontWeight: 'normal',
    lineHeight: '0.875rem',
  },
  positive: {
    color: theme.palette.colors.positive,
  },
  medium: {
    color: theme.palette.colors.medium,
  },
  negative: {
    color: theme.palette.colors.negative,
  },
  indicators: {
    lineHeight: 1,
  },
}));

const DeviceRow = ({ data, index, style }) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const t = useTranslation();

  const { items } = data;
  const item = items[index];
  const position = useSelector((state) => state.positions.items[item.id]);

  return (
    <div style={style}>
      <ListItem button key={item.id} className={classes.listItem} onClick={() => dispatch(devicesActions.select(item))}>
        <ListItemAvatar>
          <Avatar>
            <img className={classes.icon} src={`images/icon/${item.category || 'default'}.svg`} alt="" />
          </Avatar>
        </ListItemAvatar>
        <ListItemText primary={item.name} secondary={item.status} classes={{ secondary: classes[getStatusColor(item.status)] }} />
        <ListItemSecondaryAction className={classes.indicators}>
          {position && (
            <>
              {position.attributes.hasOwnProperty('ignition') && (
                <Tooltip title={`${t('positionIgnition')}: ${formatBoolean(position.attributes.ignition, t)}`}>
                  {position.attributes.ignition ? (
                    <FlashOnIcon className={classes.positive} />
                  ) : (
                    <FlashOffIcon className={classes.negative} />
                  )}
                </Tooltip>
              )}
              {position.attributes.hasOwnProperty('batteryLevel') && (
                <Tooltip title={`${t('positionBatteryLevel')}: ${formatPercentage(position.attributes.batteryLevel)}`}>
                  {position.attributes.batteryLevel > 70 ? (
                    <BatteryFullIcon className={classes.positive} />
                  ) : position.attributes.batteryLevel > 30 ? (
                    <Battery60Icon className={classes.medium} />
                  ) : (
                    <Battery20Icon className={classes.negative} />
                  )}
                </Tooltip>
              )}
            </>
          )}
        </ListItemSecondaryAction>
      </ListItem>
    </div>
  );
};

const DeviceView = ({ updateTimestamp, onMenuClick, filter }) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const listInnerEl = useRef(null);

  const items = useSelector((state) => state.devices.items);
  const [filteredItems, setFilteredItems] = useState(null);

  useEffect(() => {
    const array = Object.values(items);
    setFilteredItems(
      filter.trim().length > 0
        ? array.filter((item) => `${item.name} ${item.uniqueId}`.toLowerCase().includes(filter?.toLowerCase()))
        : array,
    );
  }, [filter, items]);

  if (listInnerEl.current) {
    listInnerEl.current.className = classes.listInner;
  }

  useEffectAsync(async () => {
    const response = await fetch('/api/devices');
    if (response.ok) {
      dispatch(devicesActions.refresh(await response.json()));
    }
  }, [updateTimestamp]);

  return (
    <AutoSizer className={classes.list}>
      {({ height, width }) => (
        <List disablePadding>
          <FixedSizeList
            width={width}
            height={height}
            itemCount={filteredItems.length}
            itemData={{ items: filteredItems, onMenuClick }}
            itemSize={72}
            overscanCount={10}
            innerRef={listInnerEl}
          >
            {DeviceRow}
          </FixedSizeList>
        </List>
      )}
    </AutoSizer>
  );
};

const DevicesList = ({ filter }) => (
  <EditCollectionView content={DeviceView} editPath="/device" endpoint="devices" disableAdd filter={filter} />
);

export default DevicesList;
