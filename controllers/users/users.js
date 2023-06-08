const bcrypt=require("bcryptjs");
const User = require("../../model/user/User");
const appErr = require("../../utils/appErr");

//register
const registerCtrl = async (req, res,next) => {
  const { fullname, email, password}=req.body;
  console.log(req.body);
  if (!fullname || !email || !password) {
    //return next(appErr("All fields are required"));
    return res.render("users/register", {
      error: "All fields are required",
    });
  }
  try {
    //check if user exists(email)
    const userFound=await User.findOne({email});
    // throw error
    if(userFound){
      // return next(appErr('User already exists'));
      return res.render("users/register", {
        error: "Email is taken",
      });
     
    }
    //Hash password
    const salt =await bcrypt.genSalt(10);
    const passwordHashed=await bcrypt.hash(password,salt);
    //register user
    const user=await User.create({
      fullname,email,password:passwordHashed,
    });
    //redirect
    res.redirect("/api/v1/users/profile-page");


    // console.log(user);
    // res.json({
    //   status: "success",
    //   data: user,
    // });
  } catch (error) {
    res.json(error);
  }
};

//login
const loginCtrl = async (req, res, next) => {

  const { email, password } = req.body;
  if (!email || !password) {
    return res.render("users/login", {
      error: "Email and password fields are required",
    });
   // return next(appErr("Email and password fields are required"));
  }
  try {
    //Check if email exist
    const userFound = await User.findOne({ email });
    if (!userFound) {
      //throw an error
      //return next(appErr("Invalid login credentials"));
      return res.render("users/login", {
        error: "Invalid login credentials",
      });
    }
    //verify password
    const isPasswordValid = await bcrypt.compare(password, userFound.password);
    if (!isPasswordValid) {
      return res.render("users/login", {
        error: "Invalid login credentials",
      });
      //throw an error
     // return next(appErr("Invalid login credentials"));
    }
    //save the user into
    req.session.userAuth = userFound._id;
    res.redirect("/api/v1/users/profile-page");
    //console.log(req.session);
    // res.json({
    //   status: "success",
    //   data: userFound,
    // });
  } catch (error) {
    res.json(error);
  }
};

//details
const userDetailsCtrl = async (req, res) => {
  try {
    //get userId from params
    const userId = req.params.id;
    //find the user
    const user = await User.findById(userId);
    res.render("users/updateUser", {
      user,
      error: "",
    });
    // res.json({
    //   status: "success",
    //   data: user,
    // });
  } catch (error) {
    res.render("users/updateUser", {
      error: error.message,
    });
    //res.json(error);
  }
};
//profile
const profileCtrl = async (req, res) => {
  try {
    //get the login user
    const userID = req.session.userAuth;
    //find the user
    const user = await User.findById(userID).populate("posts").populate("comments");
     res.render("users/profile", { user });
    // res.json({
    //   status: "success",
    //   data: user,
    // });
  } catch (error) {
    res.json(error);
  }
};

//upload profile photo
const uploadProfilePhotoCtrl = async (req, res, next) => {
 
  try {
    //check if file exist
    if (!req.file) {
      return res.render("users/uploadProfilePhoto", {
        error: "Please upload image",
      });
    }
    //1. Find the user to be updated
    const userId = req.session.userAuth;
    const userFound = await User.findById(userId);
    //2. check if user is found
    if (!userFound) {
      //return next(appErr("User not found", 403));
      return res.render("users/uploadProfilePhoto", {
        error: "User not found",
      });
    }
    //5.Update profile photo
    const userUpdated = await User.findByIdAndUpdate(
      userId,
      {
        profileImage: req.file.path,
      },
      {
        new: true,
      }
    );
    // res.json({
    //   status: "success",
    //   data: userUpdated,
    // });
    //redirect
    res.redirect("/api/v1/users/profile-page");
  } catch (error) {
    return res.render("users/uploadProfilePhoto", {
      error: error.message,
    });
    //next(appErr(error.message));
  }
};
//upload cover image

const uploadCoverImgCtrl = async (req, res) => {
  
  try {
    if (!req.file) {
      return res.render("users/uploadCoverPhoto", {
        error: "Please upload image",
      });
    }
    //1. Find the user to be updated
    const userId = req.session.userAuth;
    const userFound = await User.findById(userId);
    //2. check if user is found
    if (!userFound) {
     // return next(appErr("User not found", 403));
     return res.render("users/uploadCoverPhoto", {
      error: "User not found",
    });
    }
    //5.Update profile photo
    const userUpdated = await User.findByIdAndUpdate(
      userId,
      {
        coverImage: req.file.path,
      },
      {
        new: true,
      }
    );
    // res.json({
    //   status: "success",
    //   data: userUpdated,
    // });
        //redirect
        res.redirect("/api/v1/users/profile-page");
  } catch (error) {
   // next(appErr(error.message));
   return res.render("users/uploadProfilePhoto", {
    error: error.message,
  });
  }
};

//update password
const updatePasswordCtrl = async (req, res, next) => {
  const { password } = req.body;
  try {
    //Check if user is updating the password
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const passswordHashed = await bcrypt.hash(password, salt);
      //update user
      await User.findByIdAndUpdate(
        req.session.userAuth,
        {
          password: passswordHashed,
        },
        {
          new: true,
        }
      );
            //redirect
            res.redirect("/api/v1/users/profile-page");
      // res.json({
      //   status: "success",
      //   user: "Password has been changed successfully",
      // });
    }
  } catch (error) {
   // return next(appErr("Please provide password field"));
   return res.render("users/uploadProfilePhoto", {
    error: error.message,
  });

  }
};

//update user
const updateUserCtrl = async (req, res, next) => {
  const { fullname, email } = req.body;
  try {
    if (!fullname || !email) {
      return res.render("users/updateUser", {
        error: "Please provide details",
        user: "",
      });
    }
    //Check if email is not taken
    if (email) {
      const emailTaken = await User.findOne({ email });
      if (emailTaken) {
       // return next(appErr("Email is taken", 400));
       return res.render("users/updateUser", {
        error: "Email is taken",
        user: "",
      });
      }
    }
    //update the user
    await User.findByIdAndUpdate(
      req.session.userAuth,
      {
        fullname,
        email,
      },
      {
        new: true,
      }
    );
    res.redirect("/api/v1/users/profile-page");
    // res.json({
    //   status: "success",
    //   data: user,
    // });
  } catch (error) {
    return res.render("users/updateUser", {
      error: error.message,
      user: "",
    });
    //return next(appErr(error.message));
  }
};

//logout
const logoutCtrl = async (req, res) => {
  //destroy session
  req.session.destroy(() => {
    res.redirect("/api/v1/users/login");
  });
};

module.exports = {
  registerCtrl,
  loginCtrl,
  userDetailsCtrl,
  profileCtrl,
  uploadProfilePhotoCtrl,
  uploadCoverImgCtrl,
  updatePasswordCtrl,
  updateUserCtrl,
  logoutCtrl,
};
