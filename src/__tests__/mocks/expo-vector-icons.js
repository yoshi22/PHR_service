// Mock for @expo/vector-icons
import React from 'react';

const MockIcon = (props) => {
  const { name, size, color, testID, ...otherProps } = props;
  return React.createElement('Text', {
    testID: testID || `icon-${name}`,
    style: { fontSize: size, color },
    ...otherProps,
    children: name || 'icon',
  });
};

// Create a component constructor for each icon family
const createIconComponent = (family) => {
  const IconComponent = (props) => MockIcon({ ...props, family });
  IconComponent.displayName = family;
  return IconComponent;
};

export const AntDesign = createIconComponent('AntDesign');
export const Entypo = createIconComponent('Entypo');
export const EvilIcons = createIconComponent('EvilIcons');
export const Feather = createIconComponent('Feather');
export const FontAwesome = createIconComponent('FontAwesome');
export const FontAwesome5 = createIconComponent('FontAwesome5');
export const Fontisto = createIconComponent('Fontisto');
export const Foundation = createIconComponent('Foundation');
export const Ionicons = createIconComponent('Ionicons');
export const MaterialCommunityIcons = createIconComponent('MaterialCommunityIcons');
export const MaterialIcons = createIconComponent('MaterialIcons');
export const Octicons = createIconComponent('Octicons');
export const SimpleLineIcons = createIconComponent('SimpleLineIcons');
export const Zocial = createIconComponent('Zocial');

const iconFamilies = {
  AntDesign,
  Entypo,
  EvilIcons,
  Feather,
  FontAwesome,
  FontAwesome5,
  Fontisto,
  Foundation,
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
  Octicons,
  SimpleLineIcons,
  Zocial,
};

export default iconFamilies;
