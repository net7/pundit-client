const IconTitle = {
  ActiveWithAnnotations: 'Pundit is active ($n annotations on this page)',
  ActiveWithOneAnnotation: 'Pundit is active (1 annotation on this page)',
  ActiveWithNoAnnotations: 'Pundit is active',
  Inactive: 'Pundit is inactive',
};

export const updateBadgeTitle = (tabId: number, total: number, active = true) => {
  let title = IconTitle.Inactive;
  if (active) {
    switch (total) {
      case 0:
        title = IconTitle.ActiveWithNoAnnotations;
        break;
      case 1:
        title = IconTitle.ActiveWithOneAnnotation;
        break;
      default:
        title = IconTitle.ActiveWithAnnotations.replace('$n', `${total}`);
        break;
    }
  }
  chrome.action.setTitle({ tabId, title });
};
