var mongoose = require('mongoose');
var validate = require('mongoose-validator');


const lengthValidator = [
    validate({
        validator: 'isLength',
        arguments: [0, 255],
        message: 'Naam zou tussen 0 en 255 karakters moeten zijn'
    })
]

var Schema = mongoose.Schema;

var CommentSchema = new Schema({
    author: {type: String, default: ''},
    authorId: {type: String, default: ''},
    authorImage: {type: String, default: ''},
    comment: {type: String, default: '', validate: lengthValidator},
    date: {type: Date, default: Date.now},
});

var allRatingValueSchema = new Schema({
    authorId: {type: String, required: true},
    rating: {type: Number, required:true},
});

var ViewSchema = new Schema({
    authorId: {type: String, required: true},
});

var CourseSchema = new Schema({
    title: {type: String, default: ''},
    imgURL: {type: String, default: ''},
    authorId: {type: String, default: ''},
    author: {type: String, default: ''},
    authorEmail: {type: String, default: ''},
    URLToCourse: {type: String, default: ''},
    description: {type: String, default: ''},
    ratingAverage: {type: Number, default: 0},
    totalRatingCount: {type: Number, default: 0},
    allRatingValues: [allRatingValueSchema],
    comments: [CommentSchema],
    views: [ViewSchema],
})

var Course = mongoose.model('Course', CourseSchema);

module.exports.Course = Course;