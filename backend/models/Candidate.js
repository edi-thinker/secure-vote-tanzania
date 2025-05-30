/**
 * Candidate model represents election candidates managed by admin
 * Supports UC-A2, UC-A3, UC-A4: Admin's candidate management functionality
 */

const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a candidate name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters']
  },
  party: {
    type: String,
    required: [true, 'Please add a party name'],
    trim: true,
    maxlength: [100, 'Party name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  photo: {
    type: String,
    default: 'default-candidate.jpg'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
});

// Middleware to update the updatedAt timestamp on document update
CandidateSchema.pre('save', function(next) {
  if (!this.isNew) {
    this.updatedAt = Date.now();
  }
  next();
});

module.exports = mongoose.model('Candidate', CandidateSchema);
