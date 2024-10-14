import { useState, useEffect } from 'react';
import styles from './style.module.css';

// Types to define Menu structure
interface SubOption {
  label: string;
  command: string;
}

interface Option {
  label: string;
  command: string;
  subOptions?: SubOption[];
  isActive?: boolean;
}

interface Menu {
  label: string;
  options: Option[];
}

// Props for the ContextualMenu Component
interface ContextualMenuProps {
  menus: Menu[];
  action: (command: string) => void;
}

/**
 * ContextualMenu Component
 * This component displays a menu within a container on the screen.
 * It behaves contextually by changing its content based on user actions.
 */
const ContextualMenu: React.FC<ContextualMenuProps> = ({ menus, action }) => {
  const [currentMenu, setCurrentMenu] = useState<Menu | null>(null);
  const [currentOption, setCurrentOption] = useState<Option | null>(null);
  const [menuIndex, setMenuIndex] = useState<number>(-1);
  const [optionIndex, setOptionIndex] = useState<number>(-1);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        if (menuIndex < menus.length - 1) {
          setMenuIndex(menuIndex + 1);
          setCurrentMenu(menus[menuIndex + 1]);
          setCurrentOption(null);
          setOptionIndex(-1);
        }
      } else if (event.key === 'ArrowLeft') {
        if (menuIndex > 0) {
          setMenuIndex(menuIndex - 1);
          setCurrentMenu(menus[menuIndex - 1]);
          setCurrentOption(null);
          setOptionIndex(-1);
        }
      } else if (event.key === 'ArrowDown') {
        if (currentMenu && optionIndex < currentMenu.options.length - 1) {
          setOptionIndex(optionIndex + 1);
          setCurrentOption(currentMenu.options[optionIndex + 1]);
        }
      } else if (event.key === 'ArrowUp') {
        if (currentMenu && optionIndex > 0) {
          setOptionIndex(optionIndex - 1);
          setCurrentOption(currentMenu.options[optionIndex - 1]);
        }
      } else if (event.key === 'Enter') {
        if (currentOption) {
          handleOptionClick(currentOption);
        } else if (currentMenu && optionIndex === -1) {
          setOptionIndex(0);
          setCurrentOption(currentMenu.options[0]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuIndex, optionIndex, currentMenu, currentOption, menus]);

  /**
   * Handles clicking on a main menu item
   * @param menu The selected main menu
   */
  const handleMenuClick = (menu: Menu) => {
    setCurrentMenu(menu);
    setCurrentOption(null); // Reset option when switching menu
    setMenuIndex(menus.indexOf(menu));
    setOptionIndex(-1);
  };

  /**
   * Handles clicking on an option item
   * @param option The selected option
   */
  const handleOptionClick = (option: Option) => {
    if (option.subOptions) {
      setCurrentOption(option);
    } else {
      action(option.command);
    }
  };

  /**
   * Handles clicking on a suboption item
   * @param subOption The selected suboption
   */
  const handleSubOptionClick = (subOption: SubOption) => {
    action(subOption.command);
  };

  /**
   * Handles mouse leave event to hide options or suboptions
   */
  const handleMouseLeaveMenu = () => {
    setCurrentMenu(null);
    setCurrentOption(null);
    setMenuIndex(-1);
    setOptionIndex(-1);
  };

  const handleMouseLeaveOption = () => {
    setCurrentOption(null);
    setOptionIndex(-1);
  };

  return (
    <div className={styles.contextualMenuContainer} onMouseLeave={handleMouseLeaveMenu}>
      <div className={styles.menuList} >
        {menus.map((menu, index) => (
          <div
            key={index}
            className={`${styles.menuItem} ${menuIndex === index ? styles.active : ''}`}
            onClick={() => handleMenuClick(menu)}
          >
            {menu.label}
          </div>
        ))}
      </div>

      {currentMenu && (
        <div className={styles.optionList} onMouseLeave={handleMouseLeaveOption}>
          {currentMenu.options.map((option, index) => (
            <div
              key={index}
              className={`${styles.optionItem} ${optionIndex === index ? styles.active : ''}`}
              onClick={() => handleOptionClick(option)}
            >
              {option.label} {option.isActive && <span className={styles.activeIndicator}>✓</span>}
              {currentOption === option && option.subOptions && (
                <div className={styles.subOptionList} onMouseLeave={handleMouseLeaveOption}>
                  {option.subOptions.map((subOption, subIndex) => (
                    <div key={subIndex} className={styles.subOptionItem} onClick={() => handleSubOptionClick(subOption)}>
                      {subOption.label}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ContextualMenu;

