module.exports = fn => {
  return (req, res, next) => {
    // fn(req, res, next).catch(err => next(err));
    fn(req, res, next).catch(next);
  };
};

/*
function catchAsync = fn => (req, res, next) => {
  fn(req, res, next).catch(err => next(err));
}

module.exports = catchAsync;
*/
