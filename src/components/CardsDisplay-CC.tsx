import React from "react";
import CardCC from "./Card-CC";
import { AnimatePresence, delay, motion } from "motion/react";

const CardsDisplayCC: React.FC<CardsDisplayCCProps> = ({
  itemsList,
  title,
  subtitle,
  schema,
}) => {
  return (
    <div className={`CardsDisplayCC ${schema ? `schema-${schema}` : ""}`}>
      <AnimatePresence>
        {title || subtitle ? (
          <motion.div
            className="titlesContainer"
            key={`${title}tCont`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {title && (
              <motion.h3
                key={`${title}title`}
                initial={{ opacity: 0, translateY: -40 }}
                animate={{ opacity: 1, translateY: 0 }}
                exit={{ opacity: 0, translateY: -40 }}
                transition={{ duration: 0.5 }}
                className="CDtitle"
              >
                {title}
              </motion.h3>
            )}
            {subtitle && (
              <motion.p
                key={`${title}subtitle`}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.5 }}
                className="CDsubtitle"
              >
                {subtitle}
              </motion.p>
            )}
          </motion.div>
        ) : null}

        <motion.div
          className="cardsContainer"
          key={`${title}cCont`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {itemsList.map((cardProps, index) => {
            return cardProps ? (
              <CardCC
                key={`${index} ${title}`}
                {...cardProps}
                colorSchema={schema}
                animProps={{
                  initial: { opacity: 0 },
                  animate: { opacity: 1 },
                  exit: { opacity: 0 },
                  transition: {
                    duration: 0.1 * (index + 1),
                    delay: 0.1 * (index + 1),
                  },
                }}
              />
            ) : null;
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default CardsDisplayCC;
