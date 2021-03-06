const express = require('express')
// Passport docs: http://www.passportjs.org/docs/
const passport = require('passport')

// pull in Mongoose model for answer
const Answer = require('../models/answer')
const Survey = require('../models/survey')

// this is a collection of methods that help us detect situations when we need
// to throw a custom error
const customErrors = require('../../lib/custom_errors')

// we'll use this function to send 404 when non-existant document is requested
const handle404 = customErrors.handle404
// we'll use this function to send 401 when a user tries to modify a resource
// that's owned by someone else
const requireOwnership = customErrors.requireOwnership

// this is middleware that will remove blank fields from `req.body`, e.g.
// { example: { title: '', text: 'foo' } } -> { example: { text: 'foo' } }
const removeBlanks = require('../../lib/remove_blank_fields')
// passing this as a second argument to `router.<verb>` will make it
// so that a token MUST be passed for that route to be available
// it will also set `req.user`
const requireToken = passport.authenticate('bearer', { session: false })

// instantiate a router (mini app that only handles routes)
const router = express.Router()

// POST an answer
router.post('/answers/:surveyid', requireToken, (req, res, next) => {
  req.body.answer.owner = req.user.id
  req.body.answer.surveyRef = req.params.surveyid

  Answer.create(req.body.answer)
    .then(answer => {
      res.status(201).json({ answer: answer.toObject() })
    })
    // .then(Survey.response.push({ answer: req.answer }))
    // .then(Survey.findOneAndUpdate({id: req.params.surveyid},
    //  {$push: {answer: req.answer}}))
    .catch(next)
})

// INDEX all answers
router.get('/answers', (req, res, next) => {
  Answer.find()
    .then(answers => {
      return answers.map(answer => answer.toObject())
    })
    .then(answers => res.status(200).json({ answers: answers }))
    .catch(next)
})

// Get answers for a specific survey
router.get('/answers/', (req, res, next) => {
  Answer.find({ surveyRef: req.body.surveyRef })
    .then(handle404)
    .then(answer => res.status(200).json({ answer: answer.toObject() }))
})

module.exports = router
