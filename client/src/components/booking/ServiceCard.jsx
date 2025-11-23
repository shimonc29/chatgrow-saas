const ServiceCard = ({ service, isSelected, onClick }) => {
  return (
    <div
      onClick={() => onClick(service)}
      className={`
        p-6 rounded-xl border-2 cursor-pointer transition-all
        ${isSelected 
          ? 'border-sky-600 bg-sky-50 shadow-lg' 
          : 'border-gray-200 bg-white hover:border-sky-300 hover:shadow-md'
        }
      `}
      dir="rtl"
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-bold text-gray-900">{service.name}</h3>
        {service.color && (
          <div
            className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: service.color }}
          />
        )}
      </div>
      
      {service.description && (
        <p className="text-sm text-gray-600 mb-4">{service.description}</p>
      )}
      
      <div className="flex items-center gap-4 text-sm text-gray-700">
        <div className="flex items-center gap-2">
          <span>⏱️</span>
          <span>{service.duration} דקות</span>
        </div>
        <div className="flex items-center gap-2">
          <span>💰</span>
          <span>₪{service.price}</span>
        </div>
      </div>
      
      {isSelected && (
        <div className="mt-4 text-sky-600 font-semibold text-sm flex items-center gap-2">
          <span>✓</span>
          <span>נבחר</span>
        </div>
      )}
    </div>
  );
};

export default ServiceCard;
