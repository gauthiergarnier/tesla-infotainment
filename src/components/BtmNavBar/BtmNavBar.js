import React from 'react';
import TemperatureControl from '../TemperatureControl/TemperatureControl';
import VolumeControl from '../VolumeControl/VolumeControl';
import { getImagePath, getAppIconPath, isTeslaIcon } from '../../utils/assetPaths';
import './BtmNavBar.css';

const BtmNavBar = ({ 
    handleNavIconClick, 
    temperature, 
    setTemperature, 
    volume, 
    setVolume, 
    activeNavIcon, 
    isShelfOpen,
    isCameraForced
}) => {
    // The centre app tray. Every entry resolves to a firmware glyph except the
    // browser, which the firmware has no launcher icon for.
    const dockApps = [
        'apple-music',
        'camera',
        'bluetooth',
        'dashcam',
        'toybox',
        'open-shelf',
    ];

    const handleIconMouseDown = (event) => {
        event.currentTarget.classList.add('active');
    };

    const handleIconMouseUp = (event) => {
        event.currentTarget.classList.remove('active');
    };

    const toggleShelf = () => {
        handleNavIconClick('open-shelf');
    };

    const handleOpenAudioSettings = () => {
        handleNavIconClick('car-settings');
    };

    return (
        <div className="btmNavBar">
            <div className="btmNavItems no-select">
                <div className={`navIconWrapper car-settings`}>
                    <img 
                        className={"navIcons"} 
                        src={getImagePath(`icon-car-settings.svg`)}
                        alt={`car settings icon`}
                        onClick={() => handleNavIconClick("car-settings")}
                        onMouseDown={handleIconMouseDown}
                        onMouseUp={handleIconMouseUp}
                        onMouseLeave={handleIconMouseUp}
                    />
                </div>
                <TemperatureControl 
                    temperature={temperature}
                    onIncrement={() => setTemperature(prev => Math.min(prev + 1, 90))}
                    onDecrement={() => setTemperature(prev => Math.max(prev - 1, 60))}
                />
                <div className="dockApps">
                    {dockApps.map((icon, index) => {
                        if (icon === 'open-shelf') {
                            return (
                                <div 
                                    key="open-shelf"
                                    className={`navIconWrapper`}
                                    onClick={toggleShelf}
                                    onMouseDown={handleIconMouseDown}
                                    onMouseUp={handleIconMouseUp}
                                    onMouseLeave={handleIconMouseUp}
                                >
                                    <img 
                                        className="navIcons teslaIcon shelfGrid" 
                                        src={getAppIconPath('open-shelf')}
                                        alt={isShelfOpen ? "Close Menu" : "Open Menu"} 
                                    />
                                </div>
                            );
                        } else {
                        return (
                            <div 
                                key={`${icon}-${index}`}
                                className={`navIconWrapper ${activeNavIcon === icon ? 'active' : ''} ${isCameraForced ? 'disabled' : ''}`}
                            >
                                <img 
                                    className={`navIcons ${icon}${isTeslaIcon(icon) ? ' teslaIcon' : ''}`} 
                                    src={getAppIconPath(icon)} 
                                    alt={`${icon} icon`}
                                    onClick={() => !isCameraForced && handleNavIconClick(icon)}
                                    onMouseDown={!isCameraForced ? handleIconMouseDown : undefined}
                                    onMouseUp={!isCameraForced ? handleIconMouseUp : undefined}
                                    onMouseLeave={!isCameraForced ? handleIconMouseUp : undefined}
                                />
                            </div>
                        );
                    }
                    })}
                </div>
                <VolumeControl
                    volume={volume}
                    onVolumeChange={setVolume}
                    onOpenAudioSettings={handleOpenAudioSettings}
                />
            </div>
        </div>
    );
};

export default BtmNavBar;