/* eslint-disable react/jsx-no-bind */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-nested-ternary */

import React, {useCallback, useEffect, useRef, useState} from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {ActionGuide} from '../../../goldstone/ActionGuide/ActionGuide';
import {useSettingsContext} from './Context/SettingsContext';
import ControlPanel from './ControlPanel/ControlPanel';
import Settings from './ControlPanel/Settings';
import Navigation from './Navigation/Navigation';
import Slide from './Slider/Slide';
import SliderContent from './Slider/SliderContent';
import {debounce, getSlidesOnCurrentIndex, getWidth} from './util/util';
// import listPhotosData from '../../../assets/mocks/imageList.json';
import IconButton from '../../../goldstone/IconButton/IconButton';
import ImagePlayList from './ImagePlayList/ImagePlayList';
import ZoomController from './ZoomController/ZoomController';
import ImageIndex from './ImageIndex';
import PhotoHeader from './PhotoHeader/PhotoHeader';
import componentCss from './PhotoPlayer.module.less';

const slideSpeed = {Slow: 9000, Normal: 6000, Fast: 3000};

const PhotoPlayerBase = ({handleNavigate, hideActionGuide, hideZoomUI, slides=[], slideDirection, startSlideIndex=0}) => {
	const settingsContext = useSettingsContext();
	const contextSettingsState = settingsContext.state || settingsContext;
	const {currentSettings: {Speed, Transition}} = contextSettingsState;

	const [firstSlide, secondSlide] = [...slides];
	const lastSlide = slides[slides.length - 1];

	const autoPlayRef = useRef();
	const transitionRef = useRef();
	const resizeRef = useRef();

	const [isPlaying, setPlaying] = useState(false);
	const [isActionGuideOpen, setActionGuideOpen] = useState(true);
	const [isPlaylistOpen, setPlaylistOpen] = useState(false);
	const [showSettings, setSettings] = useState(false);
	const [direction, setDirection] = useState('right');
	const [state, setTransition] = useState({
		activeSlide: startSlideIndex,
		translate: getWidth(),
		transition: 1,
		_slides: Transition === 'Slide' ?
			[lastSlide, firstSlide, secondSlide] : [firstSlide]
	});
	const [isSlideShowOpen, setSlideShowOpen] = useState(true);
	const [isControlsHidden, setControlsHidden] = useState(false);
	const [rotation, setRotation] = useState(0);
	const {activeSlide, translate, _slides, transition} = state;
	const [playSpeed, setPlaySpeed] = useState(Speed);

	const handleResize = () => {
		setTransition({...state, translate: getWidth(), transition: 0});
	};

	const slideTransition = () => {
		let findSlides = getSlidesOnCurrentIndex(activeSlide, slides);
		setTransition({
			...state,
			_slides: findSlides,
			transition: 0,
			translate: getWidth()
		});
	};

	const setNextSlide = (index) => {
		const nextSlideIndex = index > slides.length - 1 ? 0 : index < 0 ? slides.length - 1 : index;
		setTransition({
			...state,
			activeSlide: nextSlideIndex,
			_slides: [slides[nextSlideIndex]]
		});
	};

	const nextSlide = useCallback(() => {
		const nextSlideIndex = activeSlide === slides.length - 1 ? 0 : activeSlide + 1;
		setTransition({
			...state,
			translate: translate + getWidth(),
			activeSlide: nextSlideIndex,
			_slides: Transition === 'Slide' ? _slides : [slides[nextSlideIndex]]
		});
	}, [_slides, activeSlide, slides, Transition, translate, state]);

	const prevSlide = useCallback(() => {
		const prevSlideIndex = activeSlide === 0 ? slides.length - 1 : activeSlide - 1;
		setTransition({
			...state,
			translate: 0,
			activeSlide: prevSlideIndex,
			_slides: Transition === 'Slide' ? _slides : [slides[prevSlideIndex]]
		});
	}, [activeSlide, Transition, slides, _slides, state]);

	const updateCurrentIndex = useCallback((currentIndex) => {
		if (currentIndex !== activeSlide) {
			// Check to slide left or right
			let translateX = currentIndex > activeSlide ? (translate + getWidth()) : 0;
			const slidesToPlay = [slides[currentIndex], slides[activeSlide], slides[currentIndex]];
			setTransition({
				...state,
				activeSlide: currentIndex,
				_slides: Transition === 'Slide' ? slidesToPlay : [slides[currentIndex]],
				translate: translateX
			});
		}
	}, [Transition, activeSlide, slides, state, translate]);

	const togglePlay = useCallback(
		() => setPlaying(!isPlaying),
		[isPlaying]
	);

	const rotateImage = useCallback(() => {
		let newRotation = rotation + 90;
		if (newRotation >= 360) {
			newRotation = 0;
		}
		setRotation(newRotation);
	}, [rotation]);

	const onZoom = useCallback(() => {
		setPlaying(false)
		setControlsHidden(true);
		setSlideShowOpen(false);
	}, []);

	const onPlaylistOpen = useCallback(() => {
		setPlaylistOpen(!isPlaylistOpen)
	}, [isPlaylistOpen]);

	const renderImages = useCallback(() => {
		return _slides.map((slide, i) => {
			return (<Slide
				currentSlide={activeSlide}
				setNextSlide={setNextSlide}
				slideDirection={direction}
				index={i}
				key={slide + i}
				rotation={rotation}
				url={slide.file_path}
				width={getWidth()}
				imgHeight={slide.height}
				imgWidth={slide.width}
				isPlaying={isPlaying}
				setControlsHidden={setControlsHidden}
			/>);
		});
	}, [_slides, activeSlide, rotation, setNextSlide]);

	useEffect(() => {
		const setPlayRTL = slideDirection === 'left' ? nextSlide : prevSlide;
		autoPlayRef.current = setPlayRTL;
		transitionRef.current = slideTransition;
		resizeRef.current = handleResize;
	});

	useEffect(() => {
		let interval = null;
		if (Speed) {
			setPlaySpeed(slideSpeed[Speed]);
		}
		const play = () => {
			autoPlayRef.current();
		};

		const playSmooth = e => {
			const {className} = e.target;
			if (className.includes('SliderContent')) {
				transitionRef.current();
			}
		};

		const resize = () => {
			resizeRef.current();
		};

		if (isPlaying) {
			setControlsHidden(true);
			interval = setInterval(play, playSpeed);
		} else {
			setControlsHidden(false);
			clearInterval(interval);
		}

		// const handleControls = () => {
		// 	if (isPlaying) {
		// 		setControlsHidden(false);
		// 	}
		// };

		const transitionEnd = window.addEventListener('transitionend', playSmooth);
		const onResize = window.addEventListener('resize', debounce(resize, 200));
		// const onMouseMove = window.addEventListener('mousemove', debounce(handleControls, 1000));

		return () => {
			clearInterval(interval);
			window.removeEventListener('transitionend', transitionEnd);
			window.removeEventListener('resize', onResize);
			// window.removeEventListener('mousemove', onMouseMove);
		};
	}, [Speed, isPlaying, isSlideShowOpen, playSpeed]);

	useEffect(() => {
		if (Transition !== 'Slide') {
			setTransition(prevState => (
				{
					...prevState,
					_slides: [slides[activeSlide]]
				}
			));
		}
	}, [Transition, activeSlide, slides]);

	useEffect(() => {
		const downHandler = ({keyCode, key}) => {
			if ((hideActionGuide.targetKeycodes.includes(keyCode) || key === hideActionGuide.targetKey) && isActionGuideOpen) {
				setActionGuideOpen(false);
			}
			if ((hideZoomUI.targetKeycodes.includes(keyCode) && !isActionGuideOpen)) {
				setActionGuideOpen(true);
			}
			if ((hideZoomUI.targetKeycodes.includes(keyCode) || key === hideZoomUI.targetKey) && !isSlideShowOpen) {
				setControlsHidden(false);
				setSlideShowOpen(true);
			}
		};

		window.addEventListener('keydown', downHandler);
		return () => {
			window.removeEventListener('keydown', downHandler);
		};
	}, [isActionGuideOpen, isSlideShowOpen, hideActionGuide, hideZoomUI]);

	useEffect(() => {
		if (transition === 0) {
			setTransition({...state, transition: 1});
		}
	}, [transition, state]);

	useEffect(() => {
		setRotation(0);
	}, [activeSlide]);

	const getSlideWidth = getWidth() * _slides.length;
	const navigateBack = () => {
		if(!isSlideShowOpen) {
			setSlideShowOpen(true)
		} else {
			handleNavigate('home')
		}
	}
	return (
		slides.length > 0 ?
		<div className={componentCss.photoPlayer}>
			<div
				className={classNames({[componentCss.show]: !showSettings, [componentCss.hide]: showSettings})}
				onClick={navigateBack}
			>
				<IconButton
					className={componentCss.backButton}
					iconOnly
					size="large"
					title=""
				>
					arrowhookleft
				</IconButton>
			</div>

			<div
				className={classNames({
					[componentCss.photoSlider]: true,
					[componentCss.hide]: !isSlideShowOpen,
					[componentCss.show]: isSlideShowOpen
				})}
			>
				<SliderContent
					direction={direction}
					translate={translate}
					transition={transition}
					width={getSlideWidth}
				>
					{renderImages()}
				</SliderContent>
				{showSettings && <Settings settingsHandler={setSettings} />}
			</div>
			<div
				className={classNames({[componentCss.photoZoom]: true, [componentCss.show]: !isSlideShowOpen, [componentCss.hide]: isSlideShowOpen})}
			>
				<ZoomController
					imageUrl={slides[activeSlide] && slides[activeSlide].file_path}
					setSlideShowOpen={setSlideShowOpen}
				/>
			</div>
			<div
				className={classNames({[componentCss.controlsWrapper]: true, [componentCss.show]: !isControlsHidden && isSlideShowOpen, [componentCss.hide]: isControlsHidden || !isSlideShowOpen})}
			>
				<div
					className={classNames({[componentCss.photoHeader]: true})}
				>
					<PhotoHeader
						currentPhoto={slides[activeSlide]}
					/>
				</div>
				<div
					className={classNames({[componentCss.photoIndex]: true})}
				>
					<ImageIndex currentIndex={activeSlide} length={slides.length} />
				</div>
				<div
					className={classNames({[componentCss.navigationsWrapper]: true})}
				>
					<Navigation
						leftIconClick={prevSlide}
						rigthIconClick={nextSlide}
						isPlaying={isPlaying}
						togglePlay={togglePlay}
					/>
				</div>
				<div
					className={classNames({[componentCss.controlPanelWrapper]: true, [componentCss.show]: !isActionGuideOpen, [componentCss.hide]: isActionGuideOpen})}
				>
					<ControlPanel
						onZoom={onZoom}
						rotateImage={rotateImage}
						settingsHandler={setSettings}
						showSettings={showSettings}
						onPlaylistOpen={onPlaylistOpen}
					/>
					<div
						className={classNames({[componentCss.imagePlayList]: true, [componentCss.show]: isPlaylistOpen, [componentCss.hide]: !isPlaylistOpen})}
					>
						<ImagePlayList
							imageList={slides}
							updateCurrentIndex={updateCurrentIndex}
						/>
					</div>
				</div>

				<div
					className={classNames({[componentCss.actionGuideWrapper]: true, [componentCss.show]: isActionGuideOpen, [componentCss.hide]: !isActionGuideOpen})}
				>
					<ActionGuide onClick={() => setActionGuideOpen(false)} icon="arrowsmalldown">
						Press Here to Enable Settings
					</ActionGuide>
				</div>
			</div>
		</div>
		:
		<div className={componentCss.photoPlayer}>
			<div
				className={classNames({[componentCss.show]: !showSettings, [componentCss.hide]: showSettings})}
				onClick={navigateBack}
			>
				<IconButton
					className={componentCss.backButton}
					iconOnly
					size="large"
					title=""
				>
					arrowhookleft
				</IconButton>
			</div>
		</div>
	);
};

PhotoPlayerBase.defaultProps = {
	hideActionGuide: {
		targetKey: 'ArrowDown',
		targetKeycodes: [40]
	},
	hideZoomUI: {
		targetKey: 'GoBack',
		targetKeycodes: [27, 461]
	},
	slideDirection: 'left',
	// slides: listPhotosData.imageList.results
};

PhotoPlayerBase.propTypes = {
	hideActionGuide: PropTypes.shape({
		targetKey: PropTypes.string,
		targetKeycodes: PropTypes.array
	}),
	hideZoomUI: PropTypes.shape({
		targetKey: PropTypes.string,
		targetKeycodes: PropTypes.array
	}),
	slideDirection: PropTypes.string,
	slides: PropTypes.array
};

export default React.memo(PhotoPlayerBase);
export {
	PhotoPlayerBase
};
