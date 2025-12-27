;;; Purpose: Omniscience Simulation - Biological/Social Level using Lisp
;;; Dependencies: Common Lisp (SBCL, CCL, etc.)
;;; Module Role: Uses Object-Oriented and Symbolic logic to simulate complex
;;;              human behavior and evolution

(in-package :cl-user)

(defpackage :omniscience-biological
  (:use :cl)
  (:export :create-organism
           :simulate-generation
           :evolve-population
           :organism-fitness
           :reproduce))

(in-package :omniscience-biological)

;;; Organism structure
(defstruct organism
  "Represents a biological organism in the simulation"
  (genes nil :type list :documentation "Genetic information")
  (fitness 0.0 :type float :documentation "Fitness score")
  (age 0 :type integer :documentation "Age in generations")
  (traits nil :type list :documentation "Phenotypic traits")
  (behavior nil :type list :documentation "Behavioral patterns"))

;;; Population structure
(defstruct population
  "Represents a population of organisms"
  (organisms nil :type list :documentation "List of organisms")
  (generation 0 :type integer :documentation "Current generation number")
  (environment nil :type list :documentation "Environmental factors"))

(defun create-organism (genes)
  "Create a new organism with given genes"
  (make-organism
   :genes genes
   :fitness (calculate-initial-fitness genes)
   :age 0
   :traits (genes-to-traits genes)
   :behavior (generate-behavior genes)))

(defun calculate-initial-fitness (genes)
  "Calculate initial fitness from genes"
  (let ((gene-sum (reduce #'+ genes)))
    (/ gene-sum (max 1 (length genes)))))

(defun genes-to-traits (genes)
  "Convert genetic information to phenotypic traits"
  (mapcar (lambda (gene)
            (cond
              ((> gene 0.7) :strong)
              ((> gene 0.4) :average)
              (t :weak)))
          genes))

(defun generate-behavior (genes)
  "Generate behavioral patterns from genes"
  (let ((behavior-type (nth (mod (length genes) 3) '(:aggressive :cooperative :neutral))))
    (list :type behavior-type
          :intelligence (reduce #'+ genes)
          :social-tendency (car genes))))

(defun organism-fitness (organism)
  "Calculate fitness of an organism"
  (let ((base-fitness (organism-fitness organism))
        (age-penalty (* (organism-age organism) 0.1))
        (trait-bonus (calculate-trait-bonus (organism-traits organism))))
    (max 0.0 (- (+ base-fitness trait-bonus) age-penalty))))

(defun calculate-trait-bonus (traits)
  "Calculate fitness bonus from traits"
  (let ((strong-count (count :strong traits))
        (weak-count (count :weak traits)))
    (+ (* strong-count 0.2) (* weak-count -0.1))))

(defun reproduce (parent1 parent2)
  "Reproduce two organisms to create offspring"
  (let ((child-genes
         (mapcar (lambda (g1 g2)
                   (+ (* g1 0.5) (* g2 0.5)))
                 (organism-genes parent1)
                 (organism-genes parent2))))
    ;; Add mutation
    (setf child-genes
          (mapcar (lambda (gene)
                    (let ((mutation (* (random 1.0) 0.1)))
                      (max 0.0 (min 1.0 (+ gene (- (random mutation) (/ mutation 2)))))))
                  child-genes))
    (create-organism child-genes)))

(defun simulate-generation (population)
  "Simulate one generation of evolution"
  (let* ((organisms (population-organisms population))
         (sorted-by-fitness
          (sort (copy-list organisms) #'> :key #'organism-fitness))
         (survivors (subseq sorted-by-fitness 0 (floor (length organisms) 2)))
         (new-generation
          (append survivors
                  (loop repeat (- (length organisms) (length survivors))
                        collect (reproduce
                                 (nth (random (length survivors)) survivors)
                                 (nth (random (length survivors)) survivors))))))
    (make-population
     :organisms new-generation
     :generation (1+ (population-generation population))
     :environment (population-environment population))))

(defun evolve-population (initial-population generations)
  "Evolve a population over multiple generations"
  (let ((current-population initial-population))
    (loop for gen from 1 to generations do
      (format t "Generation ~D: Average fitness = ~,2F~%"
              gen
              (/ (reduce #'+ (mapcar #'organism-fitness
                                      (population-organisms current-population)))
                 (length (population-organisms current-population))))
      (setf current-population (simulate-generation current-population)))
    current-population))

;;; Social behavior simulation
(defstruct social-group
  "Represents a social group of organisms"
  (members nil :type list)
  (hierarchy nil :type list)
  (culture nil :type list))

(defun form-social-group (organisms)
  "Form a social group from organisms"
  (make-social-group
   :members organisms
   :hierarchy (establish-hierarchy organisms)
   :culture (develop-culture organisms)))

(defun establish-hierarchy (organisms)
  "Establish social hierarchy based on fitness"
  (sort (copy-list organisms) #'> :key #'organism-fitness))

(defun develop-culture (organisms)
  "Develop cultural traits from group behavior"
  (let ((common-behaviors
         (remove-duplicates
          (mapcar (lambda (org) (getf (organism-behavior org) :type))
                  organisms))))
    (list :behaviors common-behaviors
          :cooperation-level (calculate-cooperation organisms)
          :innovation-rate (calculate-innovation organisms))))

(defun calculate-cooperation (organisms)
  "Calculate cooperation level in group"
  (let ((cooperative-count
         (count :cooperative
                (mapcar (lambda (org) (getf (organism-behavior org) :type))
                        organisms))))
    (/ cooperative-count (max 1 (length organisms)))))

(defun calculate-innovation (organisms)
  "Calculate innovation rate in group"
  (let ((avg-intelligence
         (/ (reduce #'+
                    (mapcar (lambda (org) (getf (organism-behavior org) :intelligence))
                            organisms))
            (length organisms))))
    (* avg-intelligence 0.1)))

