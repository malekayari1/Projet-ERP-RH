/**
 * Middleware pour vérifier les rôles autorisés
 * Rôles disponibles: employee, chef_equipe, manager, rh
 */
const permit = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Non authentifié" });
  }
  
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ 
      message: "Accès non autorisé pour ce rôle",
      requiredRoles: allowedRoles,
      currentRole: req.user.role
    });
  }
  
  next();
};

module.exports = permit;
  