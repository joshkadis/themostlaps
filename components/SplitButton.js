/* eslint-disable react/prop-types */
/**
 * Split button mostly copied from
 * https://material-ui.com/components/button-group/#split-button
 */
import { Fragment } from 'react';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Grow from '@material-ui/core/Grow';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import MenuItem from '@material-ui/core/MenuItem';
import MenuList from '@material-ui/core/MenuList';

import Button from './lib/Button';

export default function SplitButton({
  options = [],
  buttonClassName = '',
  shouldDisable = false,
  onSelectOption = () => {},
}) {
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef(null);
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const handleClick = () => {
    onSelectOption(options[selectedIndex]);
  };

  const handleMenuItemClick = (event, index) => {
    setSelectedIndex(index);
    setOpen(false);
    onSelectOption(options[index]);
  };

  const handleToggle = () => {
    setOpen((prevOpen) => {
      // Don't open if disabled
      if (!prevOpen && shouldDisable) {
        return false;
      }
      return !prevOpen;
    });
  };

  const handleClose = (event) => {
    if (anchorRef.current && anchorRef.current.contains(event.target)) {
      return;
    }

    setOpen(false);
  };

  return (
    <Fragment>
      <ButtonGroup ref={anchorRef}>
        <Button
          onClick={handleClick}
          disabled={shouldDisable}
          className={buttonClassName}
        >
          {options[selectedIndex]}
        </Button>
        <Button
          disabled={shouldDisable}
          onClick={handleToggle}
          className={buttonClassName}
        >
          <ArrowDropDownIcon />
        </Button>
      </ButtonGroup>
      <Popper
        open={open}
        anchorEl={anchorRef.current}
        role={undefined}
        transition
        disablePortal
      >
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{
              transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom',
            }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList id="split-button-menu">
                  {options.map((option, index) => (
                    <MenuItem
                      key={option}
                      selected={index === selectedIndex}
                      onClick={(event) => handleMenuItemClick(event, index)}
                      style={{ textTransform: 'none' }}
                    >
                      {option}
                    </MenuItem>
                  ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </Fragment>
  );
}
