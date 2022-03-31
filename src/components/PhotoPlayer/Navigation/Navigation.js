import React from 'react';
import PropTypes from 'prop-types';

import Icon from '@enact/sandstone/Icon/Icon';
import componentCss from './Navigation.module.less';

const Navigation = ({iconSize = 'large', isPlaying = true, leftIconClick, rigthIconClick, togglePlay}) => {
	return (
		<div className={componentCss.navigationWrapper} >
			<Icon
				className={componentCss.icon}
				disabled={isPlaying}
				onClick={isPlaying ? null : leftIconClick}
				size={iconSize}
				title=""
			>
				jumpbackward
			</Icon>
			<Icon
				className={componentCss.icon}
				onClick={togglePlay}
				size={iconSize}
				title=""
			>
				{isPlaying ? 'pause' : 'play'}
			</Icon>
			<Icon
				className={componentCss.icon}
				disabled={isPlaying}
				onClick={isPlaying ? null : rigthIconClick}
				size={iconSize}
				title=""
			>
				jumpforward
			</Icon>
		</div>
	);
};


Navigation.propTypes = {
	/**
	 * Size of the Icons.
	 *
	 * @type {String}
	 * @public
	 */
	iconSize: PropTypes.string,

	/**
	 * Size of the isPlaying.
	 *
	 * @type {String}
	 * @public
	 */
	isPlaying: PropTypes.bool,

	/**
	 * Callback for letfIcon.
	 *
	 * @type {String}
	 * @public
	 */

	leftIconClick: PropTypes.func,
	/**
	 * Callback for rightIcon.
	 *
	 * @type {String}
	 * @public
	 */

	rigthIconClick: PropTypes.func,
	/**
	 * Callback for toggleButton.
	 *
	 * @type {String}
	 * @public
	 */

	togglePlay: PropTypes.func
};

export default React.memo(Navigation);
