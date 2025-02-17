// Requiring our models
const db = require("../models");

// Requiring customised middleware for checking if a user is logged in
const isAuthenticated = require("../config/middleware/isAuthenticated");

// moment.js for formatting time
const moment = require("moment");

module.exports = function(app) {
  // Route for homepage
  app.get("/", (req, res) => {
    let loggedIn = false;
    if (req.user) {
      loggedIn = true;
    } else {
      loggedIn = false;
    }
    res.render("home", {
      loggedIn: loggedIn
    });
  });

  // Route for classes page
  app.get("/classes", (req, res) => {
    let loggedIn = false;
    let isNotInstructor;
    if (req.user) {
      loggedIn = true;
      if (req.user.instructor) {
        isNotInstructor = false;
      } else {
        isNotInstructor = true;
      }
    } else {
      loggedIn = false;
      isNotInstructor = true;
    }

    const classes = [];
    let instructorName;
    let classDate;
    let classEndTime;
    db.classes
      .findAll({
        include: { all: true },
        order: [["startTime", "ASC"]]
      })
      .then(results => {
        if (results.length > 0) {
          results.forEach(result => {
            let totalRating = 0;
            let numOfReviews = 0;
            let avgRating;
            result.dataValues.classReviews.forEach(review => {
              numOfReviews++;
              totalRating += review.dataValues.rating;
            });
            if (numOfReviews > 0) {
              avgRating = totalRating / numOfReviews;
            } else {
              avgRating = 0;
            }
            instructorName =
              result.dataValues.user.firstName +
              " " +
              result.dataValues.user.lastName;
            rawDate = result.dataValues.startTime;
            classDate = moment(rawDate).format("dddd, MMMM Do, h:mma");
            classEndTime = moment(result.dataValues.endTime).format("h:mma");
            result.dataValues.instructorName = instructorName;
            result.dataValues.classDate = classDate;
            result.dataValues.classEndTime = classEndTime;
            result.dataValues.isNotInstructor = isNotInstructor;
            result.dataValues.avgRating = avgRating;
            classes.push(result.dataValues);
          });
          res.render("classes", {
            classesExist: true,
            classes: classes,
            loggedIn: loggedIn
          });
        } else {
          res.render("classes", { classesExist: false });
        }
      });
  });

  // Route for reviews page
  app.get("/reviews", (req, res) => {
    let loggedIn = false;
    let isNotInstructor;
    if (req.user) {
      loggedIn = true;
      if (req.user.instructor) {
        isNotInstructor = false;
      } else {
        isNotInstructor = true;
      }
    } else {
      loggedIn = false;
      isNotInstructor = true;
    }

    let classReviews = [];
    const gymClasses = [];
    let className;
    let classReviewsExist = false;

    let instructorReviews = [];
    const instructors = [];
    let instructorName;
    let instructorReviewsExist = false;
    db.classes
      .findAll({
        include: [
          {
            model: db.classReviews,
            include: {
              model: db.user
            }
          },
          {
            model: db.user,
            include: {
              model: db.instructorReviews,
              include: { all: true }
            }
          }
        ]
      })
      .then(results => {
        // Loop through each class
        results.forEach(result => {
          //   Grab array of class reviews from each class
          const rawClassReviews = result.dataValues.classReviews;
          if (rawClassReviews.length > 0) {
            classReviewsExist = true;
            classReviews = [];
            className = result.dataValues.name;
            // Loop through array of class reviews
            rawClassReviews.forEach(rawClassReview => {
              // Push each review to classReviews
              rawClassReview.dataValues.author =
                rawClassReview.dataValues.user.dataValues.firstName +
                " " +
                rawClassReview.dataValues.user.dataValues.lastName;
              if (rawClassReview.dataValues.rating === 5) {
                rawClassReview.dataValues.ratingFive = true;
                rawClassReview.dataValues.ratingFour = false;
                rawClassReview.dataValues.ratingThree = false;
                rawClassReview.dataValues.ratingTwo = false;
                rawClassReview.dataValues.ratingOne = false;
              } else if (rawClassReview.dataValues.rating === 4) {
                rawClassReview.dataValues.ratingFive = false;
                rawClassReview.dataValues.ratingFour = true;
                rawClassReview.dataValues.ratingThree = false;
                rawClassReview.dataValues.ratingTwo = false;
                rawClassReview.dataValues.ratingOne = false;
              } else if (rawClassReview.dataValues.rating === 3) {
                rawClassReview.dataValues.ratingFive = false;
                rawClassReview.dataValues.ratingFour = false;
                rawClassReview.dataValues.ratingThree = true;
                rawClassReview.dataValues.ratingTwo = false;
                rawClassReview.dataValues.ratingOne = false;
              } else if (rawClassReview.dataValues.rating === 2) {
                rawClassReview.dataValues.ratingFive = false;
                rawClassReview.dataValues.ratingFour = false;
                rawClassReview.dataValues.ratingThree = false;
                rawClassReview.dataValues.ratingTwo = true;
                rawClassReview.dataValues.ratingOne = false;
              } else {
                rawClassReview.dataValues.ratingFive = false;
                rawClassReview.dataValues.ratingFour = false;
                rawClassReview.dataValues.ratingThree = false;
                rawClassReview.dataValues.ratingTwo = false;
                rawClassReview.dataValues.ratingOne = true;
              }
              classReviews.push(rawClassReview.dataValues);
            });
            const gymClass = {
              className: className,
              classReviews: classReviews
            };
            gymClasses.push(gymClass);
          }
        });

        db.user
          .findAll({
            where: {
              instructor: true
            },
            include: [db.instructorReviews]
          })
          .then(results => {
            results.forEach(result => {
              const rawInstructorReviews = result.dataValues.instructorReviews;
              if (rawInstructorReviews.length > 0) {
                instructorReviewsExist = true;
                instructorReviews = [];
                instructorName =
                  result.dataValues.firstName +
                  " " +
                  result.dataValues.lastName;
                // Loop through array of class reviews
                rawInstructorReviews.forEach(rawInstructorReview => {
                  if (rawInstructorReview.dataValues.rating === 5) {
                    rawInstructorReview.dataValues.ratingFive = true;
                    rawInstructorReview.dataValues.ratingFour = false;
                    rawInstructorReview.dataValues.ratingThree = false;
                    rawInstructorReview.dataValues.ratingTwo = false;
                    rawInstructorReview.dataValues.ratingOne = false;
                  } else if (rawInstructorReview.dataValues.rating === 4) {
                    rawInstructorReview.dataValues.ratingFive = false;
                    rawInstructorReview.dataValues.ratingFour = true;
                    rawInstructorReview.dataValues.ratingThree = false;
                    rawInstructorReview.dataValues.ratingTwo = false;
                    rawInstructorReview.dataValues.ratingOne = false;
                  } else if (rawInstructorReview.dataValues.rating === 3) {
                    rawInstructorReview.dataValues.ratingFive = false;
                    rawInstructorReview.dataValues.ratingFour = false;
                    rawInstructorReview.dataValues.ratingThree = true;
                    rawInstructorReview.dataValues.ratingTwo = false;
                    rawInstructorReview.dataValues.ratingOne = false;
                  } else if (rawInstructorReview.dataValues.rating === 2) {
                    rawInstructorReview.dataValues.ratingFive = false;
                    rawInstructorReview.dataValues.ratingFour = false;
                    rawInstructorReview.dataValues.ratingThree = false;
                    rawInstructorReview.dataValues.ratingTwo = true;
                    rawInstructorReview.dataValues.ratingOne = false;
                  } else {
                    rawInstructorReview.dataValues.ratingFive = false;
                    rawInstructorReview.dataValues.ratingFour = false;
                    rawInstructorReview.dataValues.ratingThree = false;
                    rawInstructorReview.dataValues.ratingTwo = false;
                    rawInstructorReview.dataValues.ratingOne = true;
                  }
                  // Push each review to instructorReviews
                  instructorReviews.push(rawInstructorReview.dataValues);
                });
                // Create instructor obj containing instructor name and associated reviews
                const instructor = {
                  instructorName: instructorName,
                  instructorReviews: instructorReviews
                };
                // Push instructor obj to instructors
                instructors.push(instructor);
              }
            });
            // Query for all users
            db.user.findAll({}).then(users => {
              instructors.forEach(instructor => {
                const instructorReviews = instructor.instructorReviews;
                instructorReviews.forEach(instructorReview => {
                  users.forEach(user => {
                    // Compare each user's id to each instructorReview authorId
                    if (user.dataValues.id === instructorReview.authorId) {
                      instructorReview.author =
                        user.dataValues.firstName +
                        " " +
                        user.dataValues.lastName;
                    }
                  });
                });
              });

              res.render("reviews", {
                loggedIn: loggedIn,
                gymClasses: gymClasses,
                classReviewsExist: classReviewsExist,
                instructors: instructors,
                instructorReviewsExist: instructorReviewsExist,
                isNotInstructor: isNotInstructor
              });
            });
          });
      });
  });

  // Route for signup page
  app.get("/signup", (req, res) => {
    // If the user already has an account send them to their profile page
    if (req.user) {
      loggedIn = true;
      res.redirect("/profile");
    } else {
      loggedIn = false;
      res.render("signup", {
        loggedIn: loggedIn
      });
    }
  });

  // Route for login page
  app.get("/login", (req, res) => {
    // If the user is already logged in, send them to their profile page
    if (req.user) {
      loggedIn = true;
      res.redirect("/profile");
    } else {
      loggedIn = false;
      res.render("login", {
        loggedIn: loggedIn
      });
    }
  });

  // Route for logging out
  app.get("/logout", (req, res) => {
    req.logout();
    res.redirect("/login");
  });

  // The isAuthenticated route prevents users who aren't logged in from accessing the profile page
  app.get("/profile", isAuthenticated, (req, res) => {
    let loggedIn = false;
    if (req.user) {
      loggedIn = true;
    } else {
      loggedIn = false;
    }
    db.user
      .findAll({
        include: [db.classes],
        where: { id: req.user.id }
      })
      .then(results => {
        let userType;
        let classDate;
        let classInstructor;
        const instructorClasses = [];
        const memberClasses = [];
        const firstName = results[0].dataValues.firstName;
        const lastName = results[0].dataValues.lastName;
        const email = results[0].dataValues.email;
        rawJoinDate = results[0].dataValues.createdAt;
        const dateJoined = moment(rawJoinDate).format(
          "dddd, MMMM Do, yyyy, h:mma"
        );
        if (results[0].dataValues.instructor === true) {
          userType = "Instructor";
          db.classes
            .findAll({
              where: {
                instructorId: req.user.id
              },
              order: [["startTime", "ASC"]]
            })
            .then(results => {
              if (results.length > 0) {
                results.forEach(result => {
                  rawClassDate = result.dataValues.startTime;
                  classDate = moment(rawClassDate).format(
                    "dddd, MMMM Do, h:mma"
                  );
                  classEndTime = moment(result.dataValues.endTime).format(
                    "h:mma"
                  );
                  htmlClassDate = moment(rawClassDate).format("YYYY-MM-DD");
                  htmlStartTime = moment(rawClassDate).format("HH:mm:ss");
                  htmlEndTime = moment(result.dataValues.endTime).format(
                    "HH:mm:ss"
                  );
                  const instructorClass = {
                    classId: result.dataValues.id,
                    htmlClassDate: htmlClassDate,
                    htmlStartTime: htmlStartTime,
                    htmlEndTime: htmlEndTime,
                    classDate: classDate,
                    classEndTime: classEndTime,
                    name: result.dataValues.name,
                    description: result.dataValues.description,
                    price: result.dataValues.price
                  };
                  instructorClasses.push(instructorClass);
                });
                res.render("profile", {
                  loggedIn: loggedIn,
                  firstName: firstName,
                  lastName: lastName,
                  email: email,
                  userType: userType,
                  dateJoined: dateJoined,
                  instructorClasses: instructorClasses,
                  instructor: true,
                  hasClasses: true
                });
              } else {
                res.render("profile", {
                  loggedIn: loggedIn,
                  firstName: firstName,
                  lastName: lastName,
                  email: email,
                  userType: userType,
                  dateJoined: dateJoined,
                  instructor: true,
                  hasClasses: false
                });
              }
            });
        } else {
          userType = "Member";
          results.forEach(result => {
            if (result.dataValues.classes.length > 0) {
              const resultArr = result.dataValues.classes;
              for (let i = 0; i < resultArr.length; i++) {
                rawClassDate = resultArr[i].dataValues.startTime;
                classDate = moment(rawClassDate).format("dddd, MMMM Do, h:mma");
                classEndTime = moment(resultArr[i].dataValues.endTime).format(
                  "h:mma"
                );
                const memberClass = {
                  classDate: classDate,
                  classEndTime: classEndTime,
                  name: resultArr[i].dataValues.name,
                  description: resultArr[i].dataValues.description,
                  price: resultArr[i].dataValues.price,
                  classId: resultArr[i].dataValues.id
                };
                db.user
                  .findOne({
                    where: {
                      id: resultArr[i].dataValues.instructorId
                    }
                  })
                  .then(result => {
                    classInstructor =
                      result.dataValues.firstName +
                      " " +
                      result.dataValues.lastName;
                    memberClass.classInstructor = classInstructor;
                    memberClasses.push(memberClass);
                    if (i === resultArr.length - 1) {
                      res.render("profile", {
                        loggedIn: loggedIn,
                        firstName: results[0].dataValues.firstName,
                        lastName: results[0].dataValues.lastName,
                        email: results[0].dataValues.email,
                        userType: userType,
                        dateJoined: dateJoined,
                        memberClasses: memberClasses,
                        member: true,
                        hasClasses: true
                      });
                    }
                  });
              }
            } else {
              res.render("profile", {
                loggedIn: loggedIn,
                firstName: results[0].dataValues.firstName,
                lastName: results[0].dataValues.lastName,
                email: results[0].dataValues.email,
                userType: userType,
                dateJoined: dateJoined,
                member: true,
                hasClasses: false
              });
            }
          });
        }
      });
  });

  // Route for 'add class' page
  app.get("/add-class", (req, res) => {
    let loggedIn;
    if (!req.user) {
      loggedIn = false;
      res.redirect("/login");
    } else {
      loggedIn = true;
      res.render("add-class", {
        loggedIn: loggedIn
      });
    }
  });
};
