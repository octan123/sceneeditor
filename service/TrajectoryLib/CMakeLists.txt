cmake_minimum_required(VERSION 3.5)
set(TARGET TrajectoryLib)
project(${TARGET})
include_directories (
  ${SCENARIOENGINE_INCLUDE_DIRS}
  ${ROADMANAGER_INCLUDE_DIR}
  ${COMMON_MINI_INCLUDE_DIR}  
)


set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS}  -std=c++11")
set ( SOURCES TrajectoryLib.cpp TrajectoryBuilder.cpp Clothoid.cpp)
set ( INCLUDES TrajectoryLib.hpp TrajectoryBuilder.h Clothoid.h)

add_library ( ${TARGET} SHARED ${SOURCES} ${INCLUDES} )

add_definitions(-D_CRT_SECURE_NO_WARNINGS)

target_link_libraries ( 
	${TARGET}
	PRIVATE ${TIME_LIB}	
)

if (UNIX)
  install ( TARGETS ${TARGET} DESTINATION "${INSTALL_DIRECTORY}")
else()
  install ( TARGETS ${TARGET} CONFIGURATIONS Release DESTINATION "${INSTALL_DIRECTORY}")
  install ( TARGETS ${TARGET} CONFIGURATIONS Debug DESTINATION "${INSTALL_DIRECTORY}")
endif (UNIX)
