import { useState } from "react";
import { motion } from "framer-motion";
import PropTypes from "prop-types";
import { toast } from "react-toastify";
import { FaEnvelope, FaUser, FaBuilding, FaLock } from "react-icons/fa";

const SignupPage = ({ onSignup, onSwitchToLogin, isLoading }) => {
  const [userData, setUserData] = useState({
    email: "",
    username: "",
    company_name: "",
    password: "",
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!userData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(userData.email)) newErrors.email = "Invalid email address";
    if (!userData.username) newErrors.username = "Username is required";
    if (!userData.company_name) newErrors.company_name = "Company name is required";
    if (!userData.password) newErrors.password = "Password is required";
    else if (userData.password.length < 8) newErrors.password = "Password must be at least 8 characters long";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error("Please fix the errors below.");
      return;
    }
    console.log("Submitting signup data:", userData);
    onSignup(userData);
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", damping: 20, stiffness: 100, duration: 0.6 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, type: "spring", damping: 20, stiffness: 100 },
    }),
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4">
      <motion.div
        className="w-full max-w-md md:max-w-lg mx-auto"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.div
          className="text-center mb-8"
          variants={itemVariants}
          custom={0}
        >
          <motion.h1
            className="text-3xl font-bold text-gray-900"
            variants={itemVariants}
            custom={0.1}
          >
            Create Account
          </motion.h1>
          <motion.p
            className="text-sm text-gray-600 mt-2"
            variants={itemVariants}
            custom={0.2}
          >
            Sign up to get started
          </motion.p>
        </motion.div>
        <motion.form
          onSubmit={handleSubmit}
          className="space-y-8 p-6 md:p-8 bg-white/90 backdrop-blur-md rounded-2xl shadow-xl"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          <motion.div variants={itemVariants} custom={0}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={userData.email}
                onChange={(e) => {
                  setUserData({ ...userData, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: "" });
                }}
                disabled={isLoading}
                className={`pl-10 w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 disabled:bg-gray-100 ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your email"
              />
            </div>
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </motion.div>
          <motion.div variants={itemVariants} custom={0.1}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <div className="relative">
              <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={userData.username}
                onChange={(e) => {
                  setUserData({ ...userData, username: e.target.value });
                  if (errors.username) setErrors({ ...errors, username: "" });
                }}
                disabled={isLoading}
                className={`pl-10 w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 disabled:bg-gray-100 ${
                  errors.username ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your username"
              />
            </div>
            {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
          </motion.div>
          <motion.div variants={itemVariants} custom={0.2}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
            <div className="relative">
              <FaBuilding className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={userData.company_name}
                onChange={(e) => {
                  setUserData({ ...userData, company_name: e.target.value });
                  if (errors.company_name) setErrors({ ...errors, company_name: "" });
                }}
                disabled={isLoading}
                className={`pl-10 w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 disabled:bg-gray-100 ${
                  errors.company_name ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your company name"
              />
            </div>
            {errors.company_name && <p className="mt-1 text-sm text-red-600">{errors.company_name}</p>}
          </motion.div>
          <motion.div variants={itemVariants} custom={0.3}>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={userData.password}
                onChange={(e) => {
                  setUserData({ ...userData, password: e.target.value });
                  if (errors.password) setErrors({ ...errors, password: "" });
                }}
                disabled={isLoading}
                className={`pl-10 w-full px-4 py-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition duration-200 disabled:bg-gray-100 ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Enter your password"
              />
            </div>
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
          </motion.div>
          <motion.button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-300 transform"
            variants={itemVariants}
            custom={0.4}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? "Signing up..." : "Sign Up"}
          </motion.button>
        </motion.form>
        <motion.p
          className="mt-6 text-center text-sm text-gray-600"
          variants={itemVariants}
          custom={0.5}
        >
          Already have an account?{" "}
          <motion.button
            onClick={onSwitchToLogin}
            disabled={isLoading}
            className="text-indigo-600 font-medium hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            Log In
          </motion.button>
        </motion.p>
      </motion.div>
    </div>
  );
};

SignupPage.propTypes = {
  onSignup: PropTypes.func.isRequired,
  onSwitchToLogin: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

export default SignupPage;