function numberOrNullProp(props, propName, componentName) {
  if (typeof props[propName] === 'undefined') {
    return new Error(
      `${componentName} missing required prop '${propName}'`,
    );
  }

  if (props[propName] !== null && typeof props[propName] !== 'number') {
    return new Error(
      `Invalid prop '${propName}' supplied to ${componentName}. Expected null or number`,
    );
  }
}

module.exports = numberOrNullProp;
