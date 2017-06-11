var express = require('express');
var router = express.Router();
var User = require('../models/User').User;
var Course = require('../models/Course').Course;
var passport = require('passport');


router.get('/getUserData', function (req, res, next) {


    // so user is logged in since there's data.
    if (req.user != null) {
        res.json(JSON.stringify({
            loggedIn: true,
            username: req.app.locals.username,
            email: req.app.locals.email,
            displayImage: req.app.locals.displayImage,
        }));
    } else if (req.user == null) {
        res.json(JSON.stringify({
            loggedIn: false
        }));
    }
});


router.get('/getUserProfile', function (req, res, next) {

    console.log('HI GET USER PROFILE!!!!');


    if (req.isAuthenticated()) {

        var finishedCoursesData = [];

        if(req.user.finishedCourses.length > 0) {
            req.user.finishedCourses.forEach((elem ,index) => {
                Course.findById(elem, function (err, course) {
                    if(!err) finishedCoursesData.push(course);
                    if((index) == (req.user.finishedCourses.length - 1)) {
                        console.log(finishedCoursesData);
                        res.json(JSON.stringify({
                            data: req.user,
                            finishedCoursesData: finishedCoursesData,
                            Authenticated: true,
                        }));
                    }
                })
            })
        } else {
            res.json(JSON.stringify({
                data: req.user,
                finishedCoursesData: finishedCoursesData,
                Authenticated: true,
            }))
        }


    } else {
        res.json(JSON.stringify({
            Authenticated: false,
        }))
    }

});

router.get('/getCourseDataById', function (req, res, next) {
    if (req.app.locals._id != null) {
        var courses = [];

        function getCoursesAndPushToArray(callback) {
            User.findById(req.app.locals._id, function (err, user) {

                user['followedCourses'].forEach(function (elem, index) {
                    Course.findById(elem, function (err, course) {
                        courses.push(course);
                        if ((index + 1) == user['followedCourses'].length) {
                            callback();
                        }
                    });
                });
            })
        }

        getCoursesAndPushToArray(function () {
            res.json(JSON.stringify({
                courses: courses,
                success: true,
            }))
        });
    } else {
        res.json(JSON.stringify({success: false}));
    }
});

router.get('/loggedIn', function (req, res, next) {
    if (req.isAuthenticated()) {
        res.json(JSON.stringify({
            Authenticated: true,
        }));
    } else {
        res.json(JSON.stringify({
            Authenticated: false,
        }))
    }
});

router.get('/createCourse', function (req, res, next) {

    // if it's set it means user is logged in
    if (req.app.locals.username != null && req.user.role === 'teacher') {

        Course.create({
            title: null,
            imgURL: null,
            author: req.app.locals.username,
            authorId: req.user.id,
            creationDate: Date.now(),

        }, function (err, doc) {
            if (err) {
                console.log(err);
            }
            res.json(doc._id);
        })
    }
    else {
        console.log('not authenticated!');
        res.json({userNotValid: true});
    }
});

router.post('/saveCourse', function (req, res, next) {
    if (req.app.locals.role == 'teacher' && req.body.delete == false) {
        Course.findById(req.body._id, function (err, doc) {
            if (doc.authorId == req.app.locals._id) {
                doc.title = req.body.title;
                doc.imgURL = req.body.imgURL;
                doc.URLToCourse = req.body.URL;
                doc.description = req.body.description;

                doc.save(function (err, updatedDoc) {
                    if (err) {
                        return console.log(err);
                    }
                    res.status(201)
                    res.json(JSON.stringify({
                        success: true
                    }))
                });
            } else {
                res.status(500);
                res.json(JSON.stringify({
                    success: false
                }))
            }
        })
    } else if (req.body.delete == true && req.app.locals.role == 'teacher') {
        Course.findById(req.body._id, function (err, doc) {
            console.log(req.body._id, doc);
            if (doc.authorId == req.app.locals._id) {
                Course.findByIdAndRemove(req.body._id, function (err, doc) {
                    res.sendStatus(200);
                });
            }
        })
    }
});

router.get('/getUserId', function (req, res, next) {
    if (req.app.locals._id != null) {
        res.json(JSON.stringify({
            id: req.app.locals._id,
            success: true
        }));
    } else if (req.app.locals._id == null) {
        res.json(JSON.stringify({
            success: false,
        }))
    }
});

router.get('/authUser', function (req, res, next) {
    if (req.app.locals._id != null) {
        res.json(JSON.stringify({
            success: true
        }));
    } else if (req.app.locals._id == null) {
        res.json(JSON.stringify({
            success: false,
        }))
    }
})


router.get('/myCourses', function (req, res, next) {
    if (req.app.locals.role == 'teacher') {
        Course.find({'authorId': req.app.locals._id}, function (err, docs) {
            console.log(docs);
            res.json(JSON.stringify({
                data: docs,
            }))
        });
    }
})

router.post('/removeCourse', function (req, res, next) {
    if (req.app.locals.role == 'teacher') {
        Course.find({'authorId': req.app.locals._id}, function (err, docs) {
            docs.forEach(function (elem) {
                if (elem._id == req.body.id && !err) {
                    console.log(req.body.id);
                    Course.findByIdAndRemove(req.body.id, function (err, doc) {
                        var response = {
                            success: true,
                            id: doc._id,
                        }
                        res.status(200)
                        res.send(response);
                    });
                } else if (err) {
                    res.status(500);
                    res.send({
                        success: false
                    })
                }
            });
        })
    }
});

router.post('/search', function (req, res, next) {
    var regex = new RegExp(req.body.searchQuery, 'i');
    Course.find({title: regex}, function (err, courses) {
        console.log(req.body.searchQuery, courses);
        if (!err) res.send({courses: courses, success: true});
        if (err) res.send({success: false});
    });
});

router.post('/getCourseById', function (req, res, next) {
    let firstTime = false;

    Course.findById(req.body._id, function (err, course) {
            User.findById(req.app.locals._id, function (err2, user) {
                if (user != null) {
                    let followedCourses;
                    let foundItem;
                    if (user.followedCourses != null) followedCourses = user.followedCourses;
                    if (followedCourses.length > 0) {
                        followedCourses.forEach((elem, index) => {
                            if (elem == course._id) {
                                foundItem = true;
                            }
                            if (index == followedCourses[followedCourses.length - 1] && foundItem === false) {
                                firstTime = true;
                            }

                        });
                    } else {
                        firstTime = true;
                    }
                }
                if (!err) res.send({
                    course: course,
                    success: true,
                    userImage: req.app.locals.displayImage,
                    userId: req.app.locals._id,
                    author: req.app.locals.username,
                    firstTime: firstTime,
                });
                if (err) res.send({course: course, success: false});
            });
        }
    )
});

router.post('/followCourse', function (req, res, next) {
    Course.findById(req.body._id, function (err, course) {
        if (err) res.send({success: false});
        if (req.app.locals._id != null && !err) {
            User.update({_id: req.app.locals._id}, {$addToSet: {followedCourses: req.body._id}}, function (err, user) {
                res.send({success: true});
                if (err) res.send({success: false});
            })
        }
    })
});

router.get('/getFollowedCourses', function (req, res, next) {
    User.findById(req.app.locals._id, function (err, user) {
        if (!err && req.app.locals._id != null) res.send({followedCourses: user.followedCourses, success: true});
        else res.send({success: false});
    })
})

router.post('/unFollowCourse', function (req, res, next) {
    User.update({_id: req.app.locals._id}, {$pull: {followedCourses: req.body._id}}, function (err, user) {
        if (!err && req.app.locals._id != null) res.send({success: true});
        else res.send({success: false});
        console.log(user);
    })
})

router.post('/rateCourse', function (req, res, next) {
    if (req.app.locals._id != null && req.body.rating <= 5 && req.body.rating >= 1) {
        Course.findById(req.body.courseId, function (err, course) {
            let sum = 0;
            var allRatingValues = course.allRatingValues;
            if (!err) {
                if (allRatingValues.length > 0) {
                    for (let i = 0; i < allRatingValues.length; i++) {
                        var elem = allRatingValues[i];
                        var index = i;
                        if (elem.authorId.equals(req.app.locals._id)) {
                            elem.rating = req.body.rating;
                            course.allRatingValues[index].rating = req.body.rating;
                        } else if ((index + 1) == allRatingValues.length) {
                            if (!elem.authorId.equals(req.app.locals._id)) {
                                allRatingValues.push({authorId: req.app.locals._id, rating: req.body.rating});
                                course.totalRatingCount += 1;
                            }
                        }
                        sum += elem.rating;
                    }
                    course.ratingAverage = sum / (allRatingValues.length);
                    course.ratingAverage = course.ratingAverage.toFixed(1);

                } else if (allRatingValues.length <= 0) {
                    course.ratingAverage = req.body.rating;
                    course.ratingAverage = course.ratingAverage.toFixed(1);
                    course.totalRatingCount = 1;
                    allRatingValues.push({authorId: req.app.locals._id, rating: req.body.rating});
                }

                course.save((err, updatedCourse) => {
                    if (err) res.json({success: false});
                    else res.json({success: true, course: updatedCourse});
                })
            }
        })
    }
})

router.post('/createComment', function (req, res, next) {
    if (req.app.locals._id != null) {
        if (req.app.locals._id.equals(req.body._id)) {
            Course.findById(req.body.courseId, function (err, course) {
                course.comments.push({
                    author: req.body.author,
                    authorId: req.app.locals._id,
                    authorImage: req.app.locals.displayImage,
                    comment: req.body.comment

                });
                course.comments.sort(function (date1, date2) {
                    // Turn your strings into dates, and then subtract them
                    // to get a value that is either negative, positive, or zero.
                    if (date1.date > date2.date) return -1;
                    if (date1.date < date2.date) return 1;
                    return 0;
                });


                course.save(function (err, updatedCourse) {

                    console.log(updatedCourse.comments);

                    if (!err) res.json({success: true, newComments: updatedCourse.comments});
                    else res.json({success: false});
                })
            })
        } else {

            res.json({success: false});
        }
    } else {
        res.json({success: false});
    }

});

router.post('/deleteComment', function (req, res, next) {
    if (req.body.userId == req.app.locals._id) {
        Course.findById(req.body.courseId, function (err, course) {
            let comments = course.comments;
            comments.forEach((elem, index) => {
                if (elem._id == req.body._id) {
                    comments = comments.splice(index, 1);
                }
            })
            course.save(function (err, updatedCourse) {
                if (!err) res.json({success: true, newComments: updatedCourse.comments});
                else res.json({success: false});
            })
        });

    }
});

router.post('/getStudentsFollowingCourse', function (req, res, next) {
    if (req.body.courseId != null) {
        Course.findById(req.body.courseId, (err, course) => {
            if (course.authorId != req.app.locals._id) {
                res.send({authenticated: false});
            }
            if (req.app.locals.role == 'teacher' && !err && course.authorId == req.app.locals._id) {
                let usersFollowingCourse = [];
                User.find({}, function (err, users) {
                    users.forEach((user) => {
                        if (user.followedCourses.includes(req.body.courseId)) {
                            let finishedCourse = false;
                            if (user.finishedCourses.includes(req.body.courseId)) {
                                finishedCourse = true;
                            }
                            usersFollowingCourse.push({
                                _id: user._id,
                                username: user.displayName,
                                email: user.email,
                                finishedCourse: finishedCourse,
                            });
                        }
                    });
                    if (usersFollowingCourse.length > 0) {
                        res.send({users: usersFollowingCourse, success: true});
                    } else {
                        res.send({success: false});
                    }
                });
            } else if (course.authorId == req.app.locals._id) {
                res.send({success: false});
            }
        })
    } else {
        res.send({success: false});
    }
});

router.post('/finishCourse', function (req, res, next) {
    if (req.body.courseId != null && req.body.notFinished == true) {
        console.log('user is finished but we say yes to him called')
        Course.findById(req.body.courseId, (err, course) => {
            if (course.authorId != req.app.locals._id) {
                res.send({authenticated: false});
            }
            if (req.app.locals.role == 'teacher' && !err && course.authorId == req.app.locals._id) {
                User.findById(req.body.user._id, function (err, user) {
                    if (!err) {
                        if (!user.finishedCourses.includes(req.body.courseId)) {
                            user.finishedCourses.push(req.body.courseId);
                            user.save((err) => {
                                if (!err) res.send({success: true, finishedCourse: true});
                            });
                        }
                    }
                })
            }
        });
    } else if (req.body.notFinished == false && req.body.courseId != null) {
        console.log('user is finished but we say no to him called')
        // this is so if the user already finished it but for some reason it isnt finished any more
        // no we undo the fact that the user finished course
        Course.findById(req.body.courseId, (err, course) => {
            if (course.authorId != req.app.locals._id) {
                res.send({authenticated: false});
            }
            console.log('first if after auth:', req.app.locals.role === 'teacher' && !err && course.authorId == req.app.locals._id);
            if (req.app.locals.role === 'teacher' && !err && course.authorId == req.app.locals._id) {
                User.findById(req.body.user._id, (err, user) => {
                    console.log('user find by id errr', err);
                    if (!err) {
                        console.log('finished courses includes', user.finishedCourses.includes(req.body.courseId));
                        if (user.finishedCourses.includes(req.body.courseId)) {
                            user.finishedCourses.forEach((elem, index) => {
                                console.log('foreach elem == courseid', elem == req.body.courseId);
                                if (elem == req.body.courseId) {
                                    user.finishedCourses.splice(index, 1);
                                    user.save((err) => {
                                        if (!err) {
                                            console.log('sending success call..');
                                            res.send({success: true, finishedCourse: false})
                                        }
                                    })
                                }
                            })
                        }
                    }
                });
            }
        });
    }
})
module.exports = router;