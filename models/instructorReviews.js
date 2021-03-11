// Creates InstructorReviews model
module.exports = function(sequelize, DataTypes) {
  const InstructorReviews = sequelize.define(
    "instructorReviews",
    {
      review: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      rating: {
        type: DataTypes.INT,
        allowNull: false
        // Rating out of 5 stars
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    },
    { freezeTableName: true }
  );

  InstructorReviews.associate = models => {
    InstructorReviews.belongsTo(models.User, {
      foreignKey: {
        name: "authorId",
        allowNull: false
      }
    });
    InstructorReviews.belongsTo(models.User, {
      foreignKey: {
        name: "adminId",
        allowNull: false
      }
    });
  };
  return InstructorReviews;
};
