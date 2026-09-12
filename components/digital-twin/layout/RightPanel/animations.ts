// Animation variants for RightPanel components
export const panelVariants = {
  collapsed: {
    width: 56, // w-14 equivalent
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1], // Smooth cubic-bezier
    }
  },
  expanded: {
    width: 320, // w-80 equivalent
    transition: {
      duration: 0.4,
      ease: [0.25, 0.1, 0.25, 1],
    }
  }
};

export const contentVariants = {
  hidden: {
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.2,
      ease: "easeOut"
    }
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      delay: 0.1,
      ease: "easeOut"
    }
  }
};

export const iconVariants = {
  collapsed: {
    rotate: 0,
    transition: { duration: 0.3, ease: "easeInOut" }
  },
  expanded: {
    rotate: 180,
    transition: { duration: 0.3, ease: "easeInOut" }
  }
}; 