const Card = ({ children, className = "", hover = false, ...props }) => {
  return (
    <div
      className={`
        bg-gray-900 border border-gray-700 rounded-2xl p-6 
        shadow-xl backdrop-blur-sm
        ${hover ? "hover:border-gray-600 hover:shadow-2xl transition-all duration-300" : ""}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  )
}

export default Card
