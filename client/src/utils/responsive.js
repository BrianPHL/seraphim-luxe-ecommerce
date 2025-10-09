export const equalizeChildrenHeightInContainer = (container) => {

    const containerChildren = container.querySelectorAll(':scope > *');
    const containerChildrenArray = Array.from(containerChildren);
    const isImageHidden = containerChildrenArray.filter(containerChild => window.getComputedStyle(containerChild).display === 'none').length === 1;

    if (containerChildren.length <= 0 || isImageHidden) return;

    containerChildren.forEach(containerChild => containerChild.style.height = 'auto');

    const referenceHeight = containerChildren[0].offsetHeight;

    containerChildren.forEach(containerChild => containerChild.style.height = `${ referenceHeight }px`)

};
